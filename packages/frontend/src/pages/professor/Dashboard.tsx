import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { professorApi } from '../../api/professor.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Section, Enrollment } from '../../types';
import { Users, BookOpen, Clock, Loader2, ChevronRight } from 'lucide-react';
import './Dashboard.css';

export default function ProfessorDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const confRes = await configApi.getCurrentSemester();
      const yr = confRes.data?.academicYear;
      const sem = confRes.data?.semester;

      const secRes = await professorApi.getMySections(yr, sem);
      setSections(secRes.data);
    } catch (err) {
      console.error('Failed to fetch professor dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  // Pre-process sections for the Timetable component (needs Enrollment[] format)
  const mockEnrollmentsForTimetable: Enrollment[] = sections.flatMap(sec => 
    sec.schedules?.map(sch => ({
      id: `${sec.id}-${sch.id}`,
      studentId: '',
      sectionId: sec.id,
      section: { ...sec, schedules: [sch] },
      status: 'ENROLLED' as any,
      academicYear: sec.academicYear,
      semester: sec.semester,
      midtermScore: 0,
      finalScore: 0,
      totalScore: 0,
      grade: undefined // Use undefined instead of null to match type
    } as unknown as Enrollment)) || []
  );

  const totalStudents = sections.reduce((sum, s) => sum + s.enrolledCount, 0);

  return (
    <div className="professor-dashboard animate-fade-in">
      <div className="dashboard-header">
        <h1>{t('nav.dashboard')}</h1>
        <p className="welcome-msg">{t('common.hello')}, {user?.firstName}!</p>
      </div>

      <div className="dashboard-stats">
        <div className="card stat-card">
          <div className="stat-icon info"><BookOpen size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Assigned Sections</span>
            <span className="stat-value">{sections.length}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon success"><Users size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{totalStudents}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon warning"><Clock size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Teaching Hours/Week</span>
            <span className="stat-value">12 hrs</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-content-left">
          <div className="card-header-row mb-md">
            <h3>{t('nav.teaching_schedule')}</h3>
          </div>
          <Timetable enrollments={mockEnrollmentsForTimetable} />
        </div>

        <div className="dashboard-content-right">
          <div className="card sections-list-card">
            <div className="card-header">
              <Users size={20} />
              <h4>Active Sections</h4>
            </div>
            <div className="sections-list-compact">
              {sections.map(sec => (
                <div key={sec.id} className="compact-section-item">
                  <div className="section-info">
                    <span className="course-code">{sec.course?.courseCode}</span>
                    <p className="course-name">{sec.course?.nameTh}</p>
                    <div className="section-meta">
                      <span>Sec {sec.sectionNo}</span>
                      <span>•</span>
                      <span>{sec.enrolledCount} {t('enrollment.capacity')}</span>
                    </div>
                  </div>
                  <button className="btn-icon">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
              {sections.length === 0 && <div className="no-data-msg">No assigned sections</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
