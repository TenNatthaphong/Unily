import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { curriculumApi } from '../../api/curriculum.api';
import { useTranslation } from '../../i18n/useTranslation';
import { Loader2, CheckCircle2, Circle, Clock, GraduationCap, X, PartyPopper } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { CurriculumCourse } from '../../types';
import './StudyPlan.css';

type PlanItem = CurriculumCourse & {
  status: 'COMPLETED' | 'REMAINING' | 'STUDYING';
  matchedCourseId?: string;
  matchedCourse?: import('../../types').Course;
};

interface SemGroup {
  year: number;
  semester: number;
  items: PlanItem[];
  credits: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL_EDUCATION: 'ศึกษาทั่วไป',
  CORE_COURSE:       'วิชาแกน',
  REQUIRED_COURSE:   'วิชาเอกบังคับ',
  MAJOR_ELECTIVE:    'วิชาเอกเลือก',
  FREE_ELECTIVE:     'วิชาเสรี',
  COOP_COURSE:       'สหกิจศึกษา',
};

export default function StudyPlan() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumCode, setCurriculumCode] = useState('');
  const [curriculumNote, setCurriculumNote] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, earned: 0, gpax: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<PlanItem | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [arrows, setArrows] = useState<{ x1: number; y1: number; x2: number; y2: number; key: string; completed: boolean }[]>([]);

  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    curriculumApi.getMyPlan()
      .then(r => {
        const { curriculum, plan, stats: s } = r.data;
        setCurriculumName(curriculum.name);
        setCurriculumCode(curriculum.curriculumCode);
        if (curriculum.note) setCurriculumNote(curriculum.note);
        const earned = s.creditsEarned;
        const total = s.totalCredits;
        setStats({ total, earned, gpax: s.gpax });
        setItems(plan as PlanItem[]);
        setIsLoading(false);
        if (total > 0 && earned >= total) {
          setShowCongrats(true);
        }
      })
      .catch(() => { toast.error('ไม่พบข้อมูลหลักสูตร'); setIsLoading(false); });
  }, []);

  const semGroups: SemGroup[] = useMemo(() => {
    const map: Record<string, SemGroup> = {};
    items.forEach(item => {
      const key = `${item.year}-${item.semester}`;
      if (!map[key]) map[key] = { year: item.year, semester: item.semester, items: [], credits: 0 };
      map[key].items.push(item);
      map[key].credits += item.course?.credits || 0;
    });
    return Object.values(map).sort((a, b) => a.year !== b.year ? a.year - b.year : a.semester - b.semester);
  }, [items]);

  const courseIdMap = useMemo(() => new Map(items.map(i => [i.courseId, i])), [items]);

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const compute = () => {
      if (!trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const newArrows: typeof arrows = [];
      for (const [courseId, item] of courseIdMap) {
        const prereqs = item.course?.prerequisites || [];
        for (const p of prereqs) {
          const srcEl = nodeRefs.current.get(p.requiresCourseId);
          const tgtEl = nodeRefs.current.get(courseId);
          if (!srcEl || !tgtEl) continue;
          const srcR = srcEl.getBoundingClientRect();
          const tgtR = tgtEl.getBoundingClientRect();
          const x1 = srcR.right - trackRect.left;
          const y1 = srcR.top + srcR.height / 2 - trackRect.top;
          const x2 = tgtR.left - trackRect.left;
          const y2 = tgtR.top + tgtR.height / 2 - trackRect.top;
          const completed =
            courseIdMap.get(p.requiresCourseId)?.status === 'COMPLETED' &&
            item.status === 'COMPLETED';
          newArrows.push({ key: `${p.requiresCourseId}-${courseId}`, x1, y1, x2, y2, completed });
        }
      }
      setArrows(newArrows);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [items, courseIdMap]);

  const pct = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <motion.div
      className="study-plan-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-info">
          <GraduationCap size={24} />
          <div>
            <h1>{t('nav.view_curriculum')}</h1>
            <p>{curriculumName} <span className="badge">{curriculumCode}</span></p>
          </div>
        </div>
        <div className="sp-progress-card card">
          <div className="sp-prog-row">
            <span>ความก้าวหน้า</span>
            <span className="sp-pct">{pct}%</span>
          </div>
          <div className="sp-prog-bar">
            <div className="sp-prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="sp-prog-credits">{stats.earned} / {stats.total} หน่วยกิต · GPAX {stats.gpax.toFixed(2)}</div>
        </div>
      </div>

      {/* Curriculum note */}
      {curriculumNote && (
        <div className="sp-note-banner">
          <span className="sp-note-icon">📌</span>
          <span>{curriculumNote}</span>
        </div>
      )}

      {/* Semester columns — horizontal scroll only if truly needed */}
      <div className="sp-flow-scroll">
        <div
          className="sp-flow-track"
          ref={trackRef}
          style={{ gridTemplateColumns: `repeat(${semGroups.length}, 244px)`, position: 'relative' }}
        >
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <defs>
              <clipPath id="sp-track-clip">
                <rect x="0" y="0" width="100%" height="100%" />
              </clipPath>
              <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(59,130,246,0.75)" />
              </marker>
              <marker id="arrow-head-done" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(16,185,129,0.85)" />
              </marker>
            </defs>
            <g clipPath="url(#sp-track-clip)">
            {(() => {
              // ── Gap-only routing ────────────────────────────────────────────
              // HALF_GAP: half the 52 px column gap — the mid-lane inside each gap.
              const HALF_GAP = 26;
              // bypassY: a horizontal lane BELOW the lowest node so non-adjacent
              // arrows travel underneath all cards without crossing any column body.
              const bypassY = arrows.length > 0
                ? Math.max(...arrows.map(a => Math.max(a.y1, a.y2))) + 48
                : 0;

              return arrows.map(a => {
                // gap1: midpoint of the gap immediately after the source column
                // gapN: midpoint of the gap immediately before the target column
                const gap1 = Math.round(a.x1 + HALF_GAP);
                const gapN = Math.round(a.x2 - HALF_GAP);
                // "adjacent" = both gap references land in the same 52 px corridor
                const adjacent = gapN - gap1 < 10;
                const d = adjacent
                  // Normal Z-path: source → gap mid → vertical → gap mid → target
                  ? `M${a.x1},${a.y1} H${gap1} V${a.y2} H${a.x2}`
                  // Bypass path: drop to the bypass lane through gap1, travel
                  // horizontally under all intermediate columns, rise to y2 through gapN
                  : `M${a.x1},${a.y1} H${gap1} V${bypassY} H${gapN} V${a.y2} H${a.x2}`;
                return (
                  <path
                    key={a.key}
                    d={d}
                    stroke={a.completed ? 'rgba(16,185,129,0.75)' : 'rgba(59,130,246,0.65)'}
                    strokeWidth="2"
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    markerEnd={a.completed ? 'url(#arrow-head-done)' : 'url(#arrow-head)'}
                    strokeDasharray={a.completed ? undefined : '4,3'}
                  />
                );
              });
            })()}
            </g>
          </svg>
          {semGroups.map(grp => (
            <div key={`${grp.year}-${grp.semester}`} className="sp-column">
              <div className="sp-col-header">
                <span className="sp-col-year">ปีที่ {grp.year} เทอม {grp.semester}</span>
                <span className="sp-col-cred">{grp.credits} หน่วยกิต</span>
              </div>
              <div className="sp-col-nodes">
                {grp.items.map(item => {
                  const c = item.matchedCourse ?? item.course;
                  const credits = c?.credits ?? '-';
                  const hasHours = c && !c.isWildcard &&
                    (c.lectureHours != null || c.labHours != null || c.selfStudyHours != null);
                  const hoursStr = hasHours
                    ? `(${c!.lectureHours ?? 0}-${c!.labHours ?? 0}-${c!.selfStudyHours ?? 0})`
                    : '';
                  return (
                    <button
                      key={item.id}
                      ref={el => {
                        if (el) nodeRefs.current.set(item.courseId, el);
                        else nodeRefs.current.delete(item.courseId);
                      }}
                      className={`sp-node ${item.status === 'COMPLETED' ? 'completed' : item.status === 'STUDYING' ? 'studying' : ''} ${item.course?.isWildcard && item.status !== 'COMPLETED' ? 'wildcard' : ''}`}
                      onClick={() => setSelected(item)}
                      title={item.matchedCourse?.nameTh || item.course?.nameTh || item.mappingPattern || ''}
                      style={{ position: 'relative', zIndex: 1 }}
                    >
                      <div className="sp-node-top">
                        <div className="sp-node-code">
                          {item.course?.isWildcard && item.status === 'COMPLETED' && item.matchedCourse
                            ? item.matchedCourse.courseCode
                            : item.course?.isWildcard && item.status !== 'COMPLETED'
                            ? (CATEGORY_LABEL[item.course.category] || 'วิชาเลือก')
                            : (item.course?.courseCode || '?')}
                        </div>
                        <div className="sp-node-credits">{credits}{hoursStr}</div>
                        <div className="sp-node-status">
                          {item.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : item.status === 'STUDYING' ? <Clock size={12} /> : <Circle size={12} />}
                        </div>
                      </div>
                      {(() => {
                        const nameTh = item.matchedCourse?.nameTh || item.course?.nameTh || '';
                        return nameTh ? <div className="sp-node-name">{nameTh}</div> : null;
                      })()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="sp-legend">
        <div className="lg-item"><CheckCircle2 size={14} color="var(--success)" /> ผ่านแล้ว</div>
        <div className="lg-item"><Clock size={14} color="var(--warning)" /> กำลังเรียน</div>
        <div className="lg-item"><Circle size={14} color="var(--text-muted)" /> ยังไม่ผ่าน</div>
        <div className="lg-item"><span className="lg-wildcard-dot" /> วิชาเลือก (placeholder)</div>
      </div>

      {/* Congratulations overlay — shown when 100% complete */}
      {showCongrats && (
        <div className="sp-overlay" onClick={() => setShowCongrats(false)}>
          <div className="sp-congrats-card" onClick={e => e.stopPropagation()}>
            <button className="sp-detail-close" onClick={() => setShowCongrats(false)}><X size={18} /></button>
            <div className="sp-congrats-icon"><PartyPopper size={48} /></div>
            <h2 className="sp-congrats-title">ยินดีด้วย! 🎉</h2>
            <p className="sp-congrats-sub">
              คุณได้เรียนครบทุกวิชาตามหลักสูตรแล้ว
            </p>
            <div className="sp-congrats-stats">
              <div className="sp-congrats-stat">
                <span className="sp-congrats-stat-val">{stats.total}</span>
                <span className="sp-congrats-stat-lbl">หน่วยกิตรวม</span>
              </div>
              <div className="sp-congrats-stat">
                <span className="sp-congrats-stat-val">{stats.gpax.toFixed(2)}</span>
                <span className="sp-congrats-stat-lbl">GPAX</span>
              </div>
            </div>
            <p className="sp-congrats-note">คุณพร้อมสำหรับการสำเร็จการศึกษา</p>
            <button className="sp-congrats-btn" onClick={() => setShowCongrats(false)}>
              รับทราบ
            </button>
          </div>
        </div>
      )}

      {/* Detail overlay */}
      {selected && (
        <div className="sp-overlay" onClick={() => setSelected(null)}>
          <div className="sp-detail-card" onClick={e => e.stopPropagation()}>
            <div className="sp-detail-header">
              <div>
                {/* For completed wildcard slots, show the actual course taken */}
                <div className="sp-detail-code">
                  {selected.matchedCourse?.courseCode || selected.course?.courseCode || '?'}
                </div>
                <div className="sp-detail-name">
                  {selected.matchedCourse?.nameTh || selected.course?.nameTh || selected.mappingPattern || '-'}
                </div>
                {(selected.matchedCourse?.nameEn || selected.course?.nameEn) && (
                  <div className="sp-detail-name-en">
                    {selected.matchedCourse?.nameEn || selected.course?.nameEn}
                  </div>
                )}
              </div>
              <button className="sp-detail-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="sp-detail-grid">
              <div className="sp-detail-row">
                <span className="sp-detail-label">หน่วยกิต</span>
                <span>{selected.course?.credits ?? '-'}</span>
              </div>
              <div className="sp-detail-row">
                <span className="sp-detail-label">หมวดหมู่</span>
                <span>{selected.course?.category ? CATEGORY_LABEL[selected.course.category] || selected.course.category : '-'}</span>
              </div>
              <div className="sp-detail-row">
                <span className="sp-detail-label">ปี/เทอมที่กำหนด</span>
                <span>ปีที่ {selected.year} เทอม {selected.semester}</span>
              </div>
              <div className="sp-detail-row">
                <span className="sp-detail-label">สถานะ</span>
                <span className={selected.status === 'COMPLETED' ? 'text-success' : selected.status === 'STUDYING' ? 'text-warning' : 'text-muted'}>
                  {selected.status === 'COMPLETED' ? '✓ ผ่านแล้ว' : selected.status === 'STUDYING' ? '⏳ กำลังเรียน' : '○ ยังไม่ผ่าน'}
                </span>
              </div>
              {selected.course?.isWildcard && (selected.status === 'COMPLETED' || selected.status === 'STUDYING') && selected.matchedCourse && (
                <div className="sp-detail-row">
                  <span className="sp-detail-label">วิชาที่ลงเรียน</span>
                  <span style={{ color: selected.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                    {selected.matchedCourse.courseCode} — {selected.matchedCourse.nameTh}
                  </span>
                </div>
              )}
              {selected.course?.isWildcard && selected.status === 'REMAINING' && (
                <div className="sp-detail-row">
                  <span className="sp-detail-label">ประเภท</span>
                  <span>วิชาเลือก (ยังไม่ได้เรียน)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
