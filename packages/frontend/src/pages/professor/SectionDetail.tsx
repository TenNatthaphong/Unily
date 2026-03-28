import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { professorApi } from '../../api/professor.api';
import type { Enrollment, Section } from '../../types';
import { ChevronLeft, Loader2, Pencil, Save, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './SectionDetail.css';

interface ScoreEdit {
  midterm: string;
  final: string;
}

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined || val === 0) return '–';
  return String(val);
}

function calcGrade(total: number): string {
  if (total >= 80) return 'A';
  if (total >= 75) return 'B_PLUS';
  if (total >= 70) return 'B';
  if (total >= 65) return 'C_PLUS';
  if (total >= 60) return 'C';
  if (total >= 55) return 'D_PLUS';
  if (total >= 50) return 'D';
  return 'F';
}

const GRADE_LABEL: Record<string, string> = {
  A: 'A', B_PLUS: 'B+', B: 'B', C_PLUS: 'C+', C: 'C', D_PLUS: 'D+', D: 'D', F: 'F',
};

const DAY_TH: Record<string, string> = {
  MON: 'จ', TUE: 'อ', WED: 'พ', THU: 'พฤ', FRI: 'ศ', SAT: 'ส', SUN: 'อา',
};

export default function SectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navSection = (location.state as { section?: Section } | null)?.section ?? null;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scores, setScores] = useState<Record<string, ScoreEdit>>({});

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await professorApi.getSectionStudents(id);
      setEnrollments(res.data);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const enterEdit = () => {
    const init: Record<string, ScoreEdit> = {};
    for (const e of enrollments) {
      init[e.id] = {
        midterm: e.midtermScore ? String(e.midtermScore) : '',
        final:   e.finalScore   ? String(e.finalScore)   : '',
      };
    }
    setScores(init);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const grades = enrollments.map(e => ({
        studentId:    e.studentId,
        midtermScore: scores[e.id]?.midterm ? parseFloat(scores[e.id].midterm) : undefined,
        finalScore:   scores[e.id]?.final   ? parseFloat(scores[e.id].final)   : undefined,
      }));
      await professorApi.updateSectionGrades(id, grades);
      toast.success('บันทึกคะแนนแล้ว — เกรดจะอัปเดตเมื่อปิดภาคเรียน');
      setIsEditing(false);
      fetchData();
    } catch {
      toast.error('บันทึกคะแนนไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sd-loading">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  // ใช้ข้อมูลจาก nav state ก่อน (แสดงทันที) แล้วค่อย override ด้วย enrollment data
  const section = enrollments[0]?.section ?? navSection ?? null;
  const course  = section?.course;

  return (
    <div className="sd-page animate-fade-in">
      <div className="sd-inner">

        {/* ── Header ── */}
        <div className="sd-header">
          <button className="btn-icon" onClick={() => navigate('/professor/dashboard')}>
            <ChevronLeft size={20} />
          </button>
          <div className="sd-title">
            <div className="sd-title-text">
              <div className="sd-title-top">
                <span className="badge">{course?.courseCode ?? '—'}</span>
                <span className="sd-sec-no">Sec.{section?.sectionNo ?? '—'}</span>
              </div>
              <h1>{course?.nameTh ?? '—'}</h1>
              <p className="sd-name-en">{course?.nameEn}</p>
            </div>
          </div>
          <div className="sd-header-actions">
            {isEditing ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X size={15} /> ยกเลิก
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
                  <Save size={15} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={enterEdit}>
                <Pencil size={15} /> กรอกคะแนน
              </button>
            )}
          </div>
        </div>

        {/* ── Info bar ── */}
        <div className="sd-info-bar card">
          <div className="sd-info-item">
            <span className="sd-info-lbl">หน่วยกิต</span>
            <span className="sd-info-val credits-fmt">
              {course ? `${course.credits}(${course.lectureHours}-${course.labHours}-${course.selfStudyHours})` : '–'}
            </span>
          </div>
          <div className="sd-info-sep" />
          <div className="sd-info-item">
            <span className="sd-info-lbl">นักศึกษา</span>
            <span className="sd-info-val">{enrollments.length} / {section?.capacity ?? '–'}</span>
          </div>
          <div className="sd-info-sep" />
          <div className="sd-info-item sd-info-schedules">
            <span className="sd-info-lbl">วัน/เวลาเรียน</span>
            <div className="sd-sched-tags">
              {section?.schedules?.length
                ? section.schedules.map(s => (
                    <span key={s.id} className={`sched-day-tag day-${s.dayOfWeek.toLowerCase()}`}>
                      <span className="sched-day-pill">{DAY_TH[s.dayOfWeek]}</span>
                      {s.startTime}–{s.endTime}
                    </span>
                  ))
                : <span className="muted">–</span>
              }
            </div>
          </div>
          <div className="sd-info-sep" />
          <div className="sd-info-item">
            <span className="sd-info-lbl">ภาคเรียน</span>
            <span className="sd-info-val">{section?.semester}/{section?.academicYear}</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card sd-table-card">
          {isEditing && (
            <div className="sd-edit-notice">
              <Pencil size={13} />
              <span>โหมดกรอกคะแนน — คะแนนจะถูกบันทึกแต่เกรดจะอัปเดตเมื่อปิดภาคเรียน</span>
            </div>
          )}
          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ–นามสกุล</th>
                  <th className="center">Midterm</th>
                  <th className="center">Final</th>
                  <th className="center">รวม</th>
                  <th className="center">เกรด</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr, i) => {
                  const midVal = isEditing
                    ? (parseFloat(scores[enr.id]?.midterm || '0') || 0)
                    : (enr.midtermScore ?? 0);
                  const finVal = isEditing
                    ? (parseFloat(scores[enr.id]?.final || '0') || 0)
                    : (enr.finalScore ?? 0);
                  const total = midVal + finVal;
                  const grade = enr.grade || (total > 0 ? calcGrade(total) : null);

                  return (
                    <tr key={enr.id}>
                      <td className="muted sm">{i + 1}</td>
                      <td><span className="mono">{enr.student?.studentCode}</span></td>
                      <td>
                        <div className="sd-student-cell">
                          <div className="sd-avatar"><User size={13} /></div>
                          <span>{enr.student?.user?.firstName} {enr.student?.user?.lastName}</span>
                        </div>
                      </td>
                      <td className="center">
                        {isEditing ? (
                          <input
                            className="sd-score-input"
                            type="number" min={0} max={100}
                            value={scores[enr.id]?.midterm ?? ''}
                            placeholder="–"
                            onChange={e => setScores(p => ({ ...p, [enr.id]: { ...p[enr.id], midterm: e.target.value } }))}
                          />
                        ) : (
                          <span className={enr.midtermScore ? 'score-val' : 'muted'}>{fmt(enr.midtermScore)}</span>
                        )}
                      </td>
                      <td className="center">
                        {isEditing ? (
                          <input
                            className="sd-score-input"
                            type="number" min={0} max={100}
                            value={scores[enr.id]?.final ?? ''}
                            placeholder="–"
                            onChange={e => setScores(p => ({ ...p, [enr.id]: { ...p[enr.id], final: e.target.value } }))}
                          />
                        ) : (
                          <span className={enr.finalScore ? 'score-val' : 'muted'}>{fmt(enr.finalScore)}</span>
                        )}
                      </td>
                      <td className="center">
                        <span className={total > 0 ? 'score-val bold' : 'muted'}>{total > 0 ? total : '–'}</span>
                      </td>
                      <td className="center">
                        {grade
                          ? <span className={`grade-badge grade-${grade}`}>{GRADE_LABEL[grade] ?? grade}</span>
                          : <span className="muted">–</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {enrollments.length === 0 && (
              <div className="sd-empty">ยังไม่มีนักศึกษาลงทะเบียนในกลุ่มเรียนนี้</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
