import { useState, useEffect, useMemo } from 'react';
import { curriculumApi, type CurriculumPlanResponse } from '../../api/curriculum.api';
import { useTranslation } from '../../i18n/useTranslation';
import { 
  CheckCircle2, Circle, 
  Loader2, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './StudyPlan.css';

export default function StudyPlan() {
  const { t } = useTranslation();
  const [data, setData] = useState<CurriculumPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await curriculumApi.getMyPlan();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load study plan');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const groupedPlan = useMemo(() => {
    if (!data) return [];
    
    const years: Record<number, Record<number, any[]>> = {};
    
    data.plan.forEach(item => {
      if (!years[item.year]) years[item.year] = {};
      if (!years[item.year][item.semester]) years[item.year][item.semester] = [];
      years[item.year][item.semester].push(item);
    });

    return Object.entries(years).sort(([a], [b]) => Number(a) - Number(b));
  }, [data]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  if (!data) return <div className="no-data-msg">No curriculum found for your profile</div>;

  const percentComplete = Math.round((data.stats.creditsEarned / (data.stats.totalCredits || 128)) * 100);

  return (
    <div className="study-plan-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>{t('nav.view_curriculum')}</h1>
          <p>{data.curriculum.name} ({data.curriculum.curriculumCode})</p>
        </div>
        
        <div className="progress-card-compact glass-panel">
          <div className="progress-info">
            <span className="label">Total Completion</span>
            <span className="val">{percentComplete}%</span>
          </div>
          <div className="progress-bar-main">
            <div className="progress-fill" style={{ width: `${percentComplete}%` }}></div>
          </div>
          <div className="credits-summary">
            <span>{data.stats.creditsEarned} / {data.stats.totalCredits} Credits</span>
          </div>
        </div>
      </div>

      <div className="curriculum-flow-container">
        {groupedPlan.map(([year, semesters]) => (
          <div key={year} className="year-section">
            <div className="year-label">
              <span className="year-num">Year {year}</span>
              <div className="line"></div>
            </div>

            <div className="semester-grid">
              {Object.entries(semesters).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, courses]) => (
                <div key={sem} className="semester-card card">
                  <div className="semester-header">
                    <h4>Semester {sem}</h4>
                    <span className="course-count">{courses.length} Courses</span>
                  </div>

                  <div className="course-items-list">
                    {courses.map(item => (
                      <div key={item.id} className={`course-plan-item ${item.status.toLowerCase()}`}>
                        <div className="status-icon">
                          {item.status === 'COMPLETED' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </div>
                        <div className="course-plan-info">
                          <span className="code">{item.course?.courseCode}</span>
                          <span className="name truncate">{item.course?.nameTh}</span>
                        </div>
                        <span className="credits">{item.course?.credits} cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend & Info */}
      <div className="plan-legend card">
        <div className="legend-header">
          <Info size={18} />
          <span>Curriculum Guide</span>
        </div>
        <div className="legend-items">
          <div className="lg-item"><div className="dot completed"></div> Completed</div>
          <div className="lg-item"><div className="dot remaining"></div> Remaining / Planned</div>
          <div className="lg-item"><div className="dot elective"></div> Elective Options (TBD)</div>
        </div>
      </div>
    </div>
  );
}
