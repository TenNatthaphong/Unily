import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import SearchFilters from '../../components/enrollment/SearchFilters';
import SectionCard from '../../components/enrollment/SectionCard';
import type { Section, Enrollment, SemesterConfig } from '../../types';
import { toast } from 'react-hot-toast';
import { Loader2, Inbox } from 'lucide-react';
import './Enrollment.css';

export default function EnrollmentPage() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<Section[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ q: '', facultyId: '', deptId: '' });

  const fetchData = useCallback(async () => {
    try {
      // 1. Get current semester first
      const confRes = await configApi.getCurrentSemester();
      setConfig(confRes.data);
      
      const yr = confRes.data?.academicYear;
      const sem = confRes.data?.semester;

      // 2. Fetch data with term filtering
      const [secRes, myRes] = await Promise.all([
        enrollmentApi.searchSections({ ...searchParams, academicYear: yr, semester: sem }),
        enrollmentApi.getMyEnrollments(yr, sem)
      ]);
      
      setSections(secRes.data);
      setMyEnrollments(myRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnroll = async (sectionId: string) => {
    toast.promise(enrollmentApi.enroll(sectionId), {
      loading: t('common.loading'),
      success: () => {
        fetchData();
        return t('enrollment.enroll') + ' Success!';
      },
      error: (e) => e.response?.data?.message || 'Enrollment failed'
    });
  };

  const handleDrop = async (sectionId: string) => {
    const enr = myEnrollments.find(e => e.sectionId === sectionId);
    if (!enr) return;
    
    toast.promise(enrollmentApi.drop(enr.id), {
      loading: t('common.loading'),
      success: () => {
        fetchData();
        return t('enrollment.drop') + ' Success!';
      },
      error: 'Drop failed'
    });
  };

  const isEnrolled = (sectionId: string) => {
    return myEnrollments.some(e => e.sectionId === sectionId && e.status !== 'DROPPED');
  };

  return (
    <div className="enrollment-page animate-fade-in">
      <div className="enrollment-header">
        <h1>{t('nav.enrollment')}</h1>
        <p className="enrollment-sub">{config ? `Academic Year ${config.academicYear} / Semester ${config.semester}` : ''}</p>
      </div>

      <SearchFilters 
        onSearch={(q) => setSearchParams(p => ({ ...p, q }))}
        onFilterChange={(f) => setSearchParams(p => ({ ...p, ...f }))}
      />

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={40} />
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <div className="sections-grid">
          {sections.length > 0 ? sections.map(sec => (
            <SectionCard 
              key={sec.id}
              section={sec}
              config={config}
              isEnrolled={isEnrolled(sec.id)}
              onEnroll={handleEnroll}
              onDrop={handleDrop}
            />
          )) : (
            <div className="no-sections-state card">
              <Inbox size={48} className="no-data-icon" />
              <h3>No courses found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
