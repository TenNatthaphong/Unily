import { useState, useEffect, useMemo } from 'react';
import { curriculumApi } from '../../api/curriculum.api';
import { curriculumItemApi } from '../../api/curriculum-item.api';
import { useTranslation } from '../../i18n/useTranslation';
import { Loader2, CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { CurriculumCourse } from '../../types';
import './StudyPlan.css';

type PlanItem = CurriculumCourse & { status: 'COMPLETED' | 'REMAINING' };

interface SemGroup {
  year: number;
  semester: number;
  items: PlanItem[];
  credits: number;
}

export default function StudyPlan() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumCode, setCurriculumCode] = useState('');
  const [stats, setStats] = useState({ total: 0, earned: 0, gpax: 0 });
  const [isLoading, setIsLoading] = useState(true);

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

      {/* Flow grid */}
      <div className="sp-flow-scroll">
        <div className="sp-flow-track" style={{ gridTemplateColumns: `repeat(${semGroups.length}, 200px)` }}>
          {semGroups.map((grp, gIdx) => (
            <div key={`${grp.year}-${grp.semester}`} className="sp-column">
              <div className="sp-col-header">
                <span className="sp-col-year">ปีที่ {grp.year} เทอม {grp.semester}</span>
                <span className="sp-col-cred">{grp.credits} cr</span>
              </div>
              <div className="sp-col-nodes">
                {grp.items.map((item, iIdx) => (
                  <div key={item.id} className="sp-node-wrapper">
                    <div className={`sp-node ${item.status === 'COMPLETED' ? 'completed' : ''} ${item.course?.isWildcard ? 'wildcard' : ''}`}>
                      <div className="sp-node-code">{item.course?.courseCode || '?'}</div>
                      <div className="sp-node-name">{item.course?.nameTh || item.mappingPattern || '-'}</div>
                      <div className="sp-node-credits">{item.course?.credits ?? '-'} cr</div>
                      <div className="sp-node-status">
                        {item.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                      </div>
                    </div>
                    {/* Connector arrow to next column */}
                    {gIdx < semGroups.length - 1 && iIdx === 0 && (
                      <div className="sp-connector" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="sp-legend">
        <div className="lg-item"><div className="sp-node mini completed"><CheckCircle2 size={10} /></div> ผ่านแล้ว</div>
        <div className="lg-item"><div className="sp-node mini"><Circle size={10} /></div> ยังไม่ผ่าน</div>
        <div className="lg-item"><div className="sp-node mini wildcard"><Circle size={10} /></div> วิชาเลือก</div>
      </div>
    </div>
  );
}
