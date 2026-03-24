import { useState, useEffect } from 'react';
import { academicRecordApi } from '../../api/academic-record.api';
import type { AcademicRecord, Grade } from '../../types';
import { BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Records.css';

const GRADE_COLORS: Record<Grade, string> = {
  A: '#10b981', B_PLUS: '#34d399', B: '#60a5fa',
  C_PLUS: '#93c5fd', C: '#fbbf24', D_PLUS: '#fb923c',
  D: '#f87171', F: '#ef4444',
};
const GRADE_LABELS: Record<Grade, string> = {
  A: 'A', B_PLUS: 'B+', B: 'B', C_PLUS: 'C+', C: 'C', D_PLUS: 'D+', D: 'D', F: 'F',
};
const GRADE_POINTS: Record<Grade, number> = {
  A: 4, B_PLUS: 3.5, B: 3, C_PLUS: 2.5, C: 2, D_PLUS: 1.5, D: 1, F: 0,
};

interface GroupedRecords {
  [key: string]: AcademicRecord[];
}

export default function StudentRecords() {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [gpax, setGpax] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicRecordApi.getMyTranscript(),
      academicRecordApi.getMyStats(),
    ]).then(([tr, st]) => {
      setRecords(tr.data);
      setGpax(st.data.gpax);
      setTotalCredits(st.data.totalCredits);
      setIsLoading(false);
    }).catch(() => { toast.error('Failed to load records'); setIsLoading(false); });
  }, []);

  const grouped: GroupedRecords = records.reduce((acc, r) => {
    const key = `${r.academicYear}/${r.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as GroupedRecords);

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="records-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><BarChart3 size={24} /><h1>ผลการเรียน</h1></div>
      </div>

      <div className="records-stats">
        <div className="stat-card card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{gpax.toFixed(2)}</div>
          <div className="stat-label">GPAX</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{totalCredits}</div>
          <div className="stat-label">หน่วยกิตสะสม</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{records.filter(r => r.grade !== 'F').length}</div>
          <div className="stat-label">วิชาที่ผ่าน</div>
        </div>
      </div>

      {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([term, termRecords]) => {
        const termCredits = termRecords.reduce((s, r) => s + r.cg, 0);
        const termGpa = termRecords.length > 0
          ? termRecords.reduce((s, r) => s + (GRADE_POINTS[r.grade] * r.cg), 0) / Math.max(termCredits, 1)
          : 0;

        return (
          <div key={term} className="term-block card">
            <div className="term-header">
              <h3>ภาคเรียน {term}</h3>
              <div className="term-summary">
                <span>GPA: <strong>{termGpa.toFixed(2)}</strong></span>
                <span>หน่วยกิต: <strong>{termCredits}</strong></span>
              </div>
            </div>
            <table className="records-table">
              <thead>
                <tr><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>หน่วยกิต</th><th>เกรด</th></tr>
              </thead>
              <tbody>
                {termRecords.map(r => (
                  <tr key={r.id}>
                    <td><span className="badge">{r.course?.courseCode}</span></td>
                    <td>{r.course?.nameTh}</td>
                    <td>{r.cg}</td>
                    <td>
                      <span className="grade-badge" style={{ color: GRADE_COLORS[r.grade], background: `${GRADE_COLORS[r.grade]}22` }}>
                        {GRADE_LABELS[r.grade]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
