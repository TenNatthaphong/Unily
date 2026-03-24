import { useState, useEffect, useMemo } from 'react';
import { curriculumApi } from '../../api/curriculum.api';
import { useTranslation } from '../../i18n/useTranslation';
import { Loader2, CheckCircle2, Circle, GraduationCap, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { CurriculumCourse } from '../../types';
import './StudyPlan.css';

type PlanItem = CurriculumCourse & { status: 'COMPLETED' | 'REMAINING'; matchedCourseId?: string };

interface SemGroup {
  year: number;
  semester: number;
  items: PlanItem[];
  credits: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL_EDUCATION: 'GE',
  CORE_COURSE: 'Core',
  REQUIRED_COURSE: 'Major',
  MAJOR_ELECTIVE: 'Elective',
  FREE_ELECTIVE: 'Free',
  COOP_COURSE: 'Co-op',
};

export default function StudyPlan() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumCode, setCurriculumCode] = useState('');
  const [stats, setStats] = useState({ total: 0, earned: 0, gpax: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<PlanItem | null>(null);

  useEffect(() => {
    curriculumApi.getMyPlan()
      .then(r => {
        const { curriculum, plan, stats: s } = r.data;
        setCurriculumName(curriculum.name);
        setCurriculumCode(curriculum.curriculumCode);
        setStats({ total: s.totalCredits, earned: s.creditsEarned, gpax: s.gpax });
        setItems(plan as PlanItem[]);
        setIsLoading(false);
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

  const pct = stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0;

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="study-plan-page animate-fade-in">
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

      {/* Semester columns — horizontal scroll only if truly needed */}
      <div className="sp-flow-scroll">
        <div className="sp-flow-track" style={{ gridTemplateColumns: `repeat(${semGroups.length}, 168px)` }}>
          {semGroups.map(grp => (
            <div key={`${grp.year}-${grp.semester}`} className="sp-column">
              <div className="sp-col-header">
                <span className="sp-col-year">ปีที่ {grp.year} เทอม {grp.semester}</span>
                <span className="sp-col-cred">{grp.credits} cr</span>
              </div>
              <div className="sp-col-nodes">
                {grp.items.map(item => (
                  <button
                    key={item.id}
                    className={`sp-node ${item.status === 'COMPLETED' ? 'completed' : ''} ${item.course?.isWildcard && item.status !== 'COMPLETED' ? 'wildcard' : ''}`}
                    onClick={() => setSelected(item)}
                    title={item.course?.nameTh || item.mappingPattern || ''}
                  >
                    <div className="sp-node-code">
                      {item.course?.isWildcard && item.status !== 'COMPLETED'
                        ? (CATEGORY_LABEL[item.course.category] || 'Elective')
                        : (item.course?.courseCode || '?')}
                    </div>
                    <div className="sp-node-credits">{item.course?.credits ?? '-'} cr</div>
                    <div className="sp-node-status">
                      {item.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="sp-legend">
        <div className="lg-item"><CheckCircle2 size={14} color="var(--success)" /> ผ่านแล้ว</div>
        <div className="lg-item"><Circle size={14} color="var(--text-muted)" /> ยังไม่ผ่าน</div>
        <div className="lg-item"><span className="lg-wildcard-dot" /> วิชาเลือก (placeholder)</div>
      </div>

      {/* Detail overlay */}
      {selected && (
        <div className="sp-overlay" onClick={() => setSelected(null)}>
          <div className="sp-detail-card" onClick={e => e.stopPropagation()}>
            <div className="sp-detail-header">
              <div>
                <div className="sp-detail-code">{selected.course?.courseCode || '?'}</div>
                <div className="sp-detail-name">{selected.course?.nameTh || selected.mappingPattern || '-'}</div>
                {selected.course?.nameEn && <div className="sp-detail-name-en">{selected.course.nameEn}</div>}
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
                <span className={selected.status === 'COMPLETED' ? 'text-success' : 'text-muted'}>
                  {selected.status === 'COMPLETED' ? '✓ ผ่านแล้ว' : '○ ยังไม่ผ่าน'}
                </span>
              </div>
              {selected.course?.isWildcard && (
                <div className="sp-detail-row">
                  <span className="sp-detail-label">ประเภท</span>
                  <span>วิชาเลือก (Elective Placeholder)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
