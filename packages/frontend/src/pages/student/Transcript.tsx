import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { academicRecordApi } from '../../api/academic-record.api';
import type { AcademicRecord } from '../../types';
import { FileText, Download, Award, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Transcript.css';

export default function Transcript() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await academicRecordApi.getMyTranscript();
        setRecords(res.data);
      } catch (err) {
        toast.error('Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, AcademicRecord[]> = {};
    records.forEach(r => {
      const key = `${r.academicYear}/${r.semester}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  return (
    <div className="transcript-page animate-fade-in">
      <div className="page-header">
        <div className="header-info">
          <h1>{t('nav.academic_records')}</h1>
          <p>Official Grade History & Performance</p>
        </div>
        <button className="btn btn-secondary">
          <Download size={18} />
          Export PDF
        </button>
      </div>

      {/* Summary Summary */}
      <div className="transcript-stats">
        <div className="card stat-summary">
          <div className="stat-circle">
            <GraduationCap size={32} />
          </div>
          <div className="stat-group">
            <span className="label">GPAX</span>
            <span className="value">3.85</span> {/* Mock calculated value */}
          </div>
          <div className="stat-group">
            <span className="label">Credits Earned (CS)</span>
            <span className="value">114 / 128</span>
          </div>
          <div className="stat-group">
            <span className="label">Status</span>
            <span className="value text-success">Active / Studying</span>
          </div>
        </div>
      </div>

      <div className="transcript-history">
        {groupedRecords.map(([term, items]) => {
          const termGPA = 4.0; // Mock calculation
          return (
            <div key={term} className="term-block card">
              <div className="term-header">
                <h3>Semester {term}</h3>
                <div className="term-stats">
                  <span>Term GPA: <b className="text-primary">{termGPA.toFixed(2)}</b></span>
                  <span>Credits: <b>{items.reduce((s, i) => s + (i.course?.credits || 0), 0)}</b></span>
                </div>
              </div>
              
              <div className="transcript-table-wrapper">
                <table className="transcript-table">
                  <thead>
                    <tr>
                      <th className="w-32">Course Code</th>
                      <th>Course Title</th>
                      <th className="w-24 text-center">Credit</th>
                      <th className="w-24 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.id}>
                        <td className="font-mono font-bold text-primary">{r.course?.courseCode}</td>
                        <td className="font-semibold">{r.course?.nameTh}</td>
                        <td className="text-center">{r.course?.credits}</td>
                        <td className="text-center">
                          <span className={`grade-pill grade-${r.grade}`}>{r.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
