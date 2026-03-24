import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { academicRecordApi, type TranscriptResponse } from '../../api/academic-record.api';
import { GraduationCap, Loader2, Award, FileCheck, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Transcript.css';

const GRADE_LABELS: Record<string, string> = {
  A: 'A', B_PLUS: 'B+', B: 'B', C_PLUS: 'C+', C: 'C', D_PLUS: 'D+', D: 'D', F: 'F',
};

const STATUS_TH: Record<string, string> = {
  STUDYING: 'กำลังศึกษา',
  GRADUATED: 'สำเร็จการศึกษา',
  RETIRED: 'พักการศึกษา',
};

export default function Transcript() {
  const { t } = useTranslation();
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await academicRecordApi.getMyTranscript();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const groupedRecords = useMemo(() => {
    if (!data?.records) return [];
    const groups: Record<string, any[]> = {};
    data.records.forEach(r => {
      const key = `${r.academicYear}/${r.semester}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  // All distinct terms for dropdown
  const termOptions = useMemo(() => groupedRecords.map(([term]) => term), [groupedRecords]);

  // Filter by selected term
  const visibleGroups = useMemo(() => {
    if (selectedTerm === 'ALL') return groupedRecords;
    return groupedRecords.filter(([term]) => term === selectedTerm);
  }, [groupedRecords, selectedTerm]);

  if (isLoading) {
    return (
      <div className="loading-state-premium">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  if (!data) return <div className="no-data-msg">ยังไม่มีข้อมูลผลการเรียน</div>;

  const { studentInfo, summary } = data;

  return (
    <motion.div
      className="transcript-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="page-header">
        <div className="header-info">
          <span className="badge badge-info">{studentInfo.studentCode}</span>
          <h1>{t('nav.academic_records')}</h1>
          <div className="student-meta">
            <span>{studentInfo.department.nameTh}</span>
            <span>•</span>
            <span>{studentInfo.faculty.nameTh}</span>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stat-summary card glass-panel">
        <div className="stat-circle">
          <GraduationCap size={32} />
        </div>
        <div className="stat-group">
          <span className="label">GPAX</span>
          <span className="value">{summary.gpax.toFixed(2)}</span>
        </div>
        <div className="stat-group">
          <span className="label">หน่วยกิตสะสม (CS)</span>
          <span className="value">{summary.totalCS} / 128</span>
        </div>
        <div className="stat-group">
          <span className="label">สถานะ</span>
          <span className="value status-pill">{STATUS_TH[studentInfo.status] ?? studentInfo.status}</span>
        </div>
      </div>

      {/* Term Filter */}
      <div className="transcript-filter-row">
        <label className="filter-label">ภาคเรียน</label>
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={selectedTerm}
            onChange={e => setSelectedTerm(e.target.value)}
          >
            <option value="ALL">ทุกภาคเรียน</option>
            {termOptions.map(term => (
              <option key={term} value={term}>ภาคเรียน {term}</option>
            ))}
          </select>
          <ChevronDown size={14} className="filter-select-icon" />
        </div>
      </div>

      <div className="transcript-history">
        {visibleGroups.map(([term, items]) => {
          const termCA = items.reduce((s: number, i: any) => s + (i.ca || 0), 0);
          const termGP = items.reduce((s: number, i: any) => s + (i.gp || 0), 0);
          const termGPA = termCA > 0 ? (termGP / termCA) : 0;

          return (
            <div key={term} className="term-block card animate-fade-in">
              <div className="term-header">
                <h3>Semester {term}</h3>
                <div className="term-summary-stats">
                  <div className="term-stat">
                    <Award size={14} />
                    <span>GPA: <b>{termGPA.toFixed(2)}</b></span>
                  </div>
                  <div className="term-stat">
                    <FileCheck size={14} />
                    <span>Credits: <b>{items.reduce((s: number, i: any) => s + (i.course?.credits || 0), 0)}</b></span>
                  </div>
                </div>
              </div>

              <div className="transcript-table-wrapper">
                <table className="transcript-table">
                  <thead>
                    <tr>
                      <th className="w-32">Course</th>
                      <th>Title</th>
                      <th className="w-24 text-center">Cr.</th>
                      <th className="w-24 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r: any) => (
                      <tr key={r.id}>
                        <td className="font-mono text-primary font-bold">{r.course?.courseCode}</td>
                        <td className="font-semibold">{r.course?.nameTh}</td>
                        <td className="text-center">{r.course?.credits}</td>
                        <td className="text-center">
                          <span className={`grade-pill grade-${r.grade?.replace('_', '')}`}>
                            {GRADE_LABELS[r.grade] ?? r.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {visibleGroups.length === 0 && (
          <div className="no-data-msg">ไม่พบข้อมูลในภาคเรียนนี้</div>
        )}
      </div>
    </motion.div>
  );
}
