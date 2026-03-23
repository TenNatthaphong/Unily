import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { professorApi } from '../../api/professor.api';
import type { Enrollment } from '../../types';
import { Save, ChevronLeft, Loader2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Grading.css';

export default function SectionGrading() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await professorApi.getSectionStudents(id);
      setEnrollments(res.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScoreChange = (enrollmentId: string, value: string) => {
    const score = parseFloat(value) || 0;
    setEnrollments(items => items.map(item => 
      item.id === enrollmentId ? { ...item, totalScore: score } : item
    ));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(enrollments.map(e => 
        professorApi.updateGrade(e.id, e.totalScore)
      ));
      toast.success('All grades saved successfully');
    } catch (err) {
      toast.error('Some grades failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  const section = enrollments[0]?.section;

  return (
    <div className="grading-page animate-fade-in">
      <div className="grading-header">
        <button className="btn-icon circle-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <div className="header-text">
          <h1>{t('nav.grading')}</h1>
          <p>{section?.course?.courseCode} - Sec {section?.sectionNo}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveAll} disabled={isSaving}>
          <Save size={18} />
          {isSaving ? t('common.loading') : 'Save All Grades'}
        </button>
      </div>

      <div className="card table-card overflow-x-auto">
        <table className="grading-table">
          <thead>
            <tr>
              <th>{t('nav.students')}</th>
              <th className="w-48 text-center">Score (100)</th>
              <th className="w-32 text-center">Auto Grade</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(enr => (
              <tr key={enr.id}>
                <td>
                  <div className="student-cell">
                    <div className="avatar-mini"><User size={14} /></div>
                    <div className="student-name">
                      <span className="name">{enr.student?.user?.firstName} {enr.student?.user?.lastName}</span>
                      <span className="code">{enr.student?.studentCode}</span>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <input
                    type="number"
                    className="score-input"
                    value={enr.totalScore}
                    onChange={(e) => handleScoreChange(enr.id, e.target.value)}
                    max={100}
                    min={0}
                  />
                </td>
                <td className="text-center">
                  <span className={`grade-badge grade-${enr.grade || 'F'}`}>
                    {/* Simplified: Frontend calculation of grade for visual feedback */}
                    {enr.totalScore >= 80 ? 'A' : enr.totalScore >= 70 ? 'B' : enr.totalScore >= 60 ? 'C' : enr.totalScore >= 50 ? 'D' : 'F'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {enrollments.length === 0 && <div className="no-data-msg p-xl">No students enrolled yet</div>}
      </div>
    </div>
  );
}
