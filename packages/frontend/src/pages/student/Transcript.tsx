import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { academicRecordApi, type TranscriptResponse } from '../../api/academic-record.api';
import { GraduationCap, Loader2, Award, FileCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Select } from '../../components/ui/Select';
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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);

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

  // Distinct academic years, sorted desc
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    groupedRecords.forEach(([term]) => {
      const yr = parseInt(term.split('/')[0], 10);
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [groupedRecords]);

  // Semesters available for the selected year
  const semOptions = useMemo(() => {
    if (selectedYear === null) return [];
    const sems = new Set<number>();
    groupedRecords.forEach(([term]) => {
      const [yr, sem] = term.split('/').map(Number);
      if (yr === selectedYear) sems.add(sem);
    });
    return Array.from(sems).sort((a, b) => a - b);
  }, [groupedRecords, selectedYear]);

  // When year changes, reset sem if no longer valid
  const handleYearChange = (yr: number | null) => {
    setSelectedYear(yr);
    setSelectedSem(null);
  };

  // Filter visible groups
  const visibleGroups = useMemo(() => {
    if (selectedYear === null) return groupedRecords;
    return groupedRecords.filter(([term]) => {
      const [yr, sem] = term.split('/').map(Number);
      if (yr !== selectedYear) return false;
      if (selectedSem !== null && sem !== selectedSem) return false;
      return true;
    });
  }, [groupedRecords, selectedYear, selectedSem]);

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

      {/* ── Term Filter: year dropdown + semester pills ───────────────────── */}
      <div className="transcript-filter-row">
        <label className="filter-label">ปีการศึกษา</label>

        {/* Year select */}
        <div className="filter-select-wrap" style={{ minWidth: 180 }}>
          <Select
            value={selectedYear ? String(selectedYear) : ''}
            onChange={val => handleYearChange(val === '' ? null : Number(val))}
            options={[
              { value: '', label: 'ทุกปีการศึกษา' },
              ...yearOptions.map(yr => ({ value: String(yr), label: String(yr) }))
            ]}
          />
        </div>

        {/* Semester pill buttons — only when a year is selected */}
        <AnimatePresence>
          {selectedYear !== null && (
            <motion.div
              className="filter-sem-group"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <button
                className={`filter-sem-btn ${selectedSem === null ? 'active' : ''}`}
                onClick={() => setSelectedSem(null)}
              >
                ทั้งหมด
              </button>
              {[1, 2, 3].map(s => (
                <button
                  key={s}
                  className={`filter-sem-btn ${selectedSem === s ? 'active' : ''} ${!semOptions.includes(s) ? 'disabled' : ''}`}
                  onClick={() => semOptions.includes(s) && setSelectedSem(s === selectedSem ? null : s)}
                  disabled={!semOptions.includes(s)}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="transcript-history">
        {visibleGroups.map(([term, items]) => {
          const termCA = items.reduce((s: number, i: any) => s + (i.ca || 0), 0);
          const termGP = items.reduce((s: number, i: any) => s + (i.gp || 0), 0);
          const termGPA = termCA > 0 ? (termGP / termCA) : 0;

          return (
            <div key={term} className="term-block card animate-fade-in">
              <div className="term-header">
                <h3>ภาคเรียน {term}</h3>
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
          <div className="no-data-msg">ไม่พบข้อมูลในภาคเรียนที่เลือก</div>
        )}
      </div>
    </motion.div>
  );
}
