import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  ChevronLeft, Edit2, Trash2, Users, Clock, MapPin, User, BookOpen, Save,
  Cloud, CloudOff, RefreshCw, ChevronRight, X
} from 'lucide-react';
import { getCategoryLabel, getCategoryColor, type Course } from "@/app/admin/components/mock-data";
import { fetchAllCurriculumData } from "@/app/admin/components/curriculum-api";
import { mockSectionsDetailed, type MockSection } from "@/app/admin/components/admin-shared";

export function AdminCourseDetail() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const sections = mockSectionsDetailed.filter(s => s.courseId === courseId);

  const loadCourse = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchAllCurriculumData();
      const found = data.courses.find(c => c.id === courseId);
      if (!found) throw new Error(`ไม่พบวิชา ${courseId}`);
      setCourse(found);
    } catch (err) {
      setError(`${err}`);
    } finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-[14px]">กำลังโหลดข้อมูลรายวิชา...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <CloudOff className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-[14px]">{error || 'ไม่พบรายวิชา'}</p>
          <button onClick={() => router.push('/admin/courses')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px]">
            <ChevronLeft className="w-4 h-4" />กลับหน้ารายวิชา
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Top Section — 2/5 */}
      <div className="shrink-0 border-b-2 border-border bg-card" style={{ height: '40%' }}>
        <div className="h-full flex flex-col p-6">
          {/* Back + Actions */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push('/admin/courses')} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              กลับหน้ารายวิชา
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[13px]"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'ยกเลิก' : 'แก้ไข'}
              </button>
              <button
                onClick={() => { /* delete logic */ }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-[13px]"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            </div>
          </div>

          {/* Course Info */}
          <div className="flex-1 grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getCategoryColor(course.category)}`}>
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-[22px]">{course.id}</h1>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full ${getCategoryColor(course.category)}`}>
                    {getCategoryLabel(course.category)}
                  </span>
                </div>
              </div>
              <h2 className="text-[18px] mb-1">{course.nameEn}</h2>
              <p className="text-[15px] text-muted-foreground">{course.nameTh}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="หน่วยกิต" value={`${course.credits}`} sub={`${course.lectureHours}-${course.labHours}-${course.selfStudyHours}`} />
              <InfoCard label="บรรยาย" value={`${course.lectureHours} ชม.`} />
              <InfoCard label="ปฏิบัติ" value={`${course.labHours} ชม.`} />
              <InfoCard label="ศึกษาเอง" value={`${course.selfStudyHours} ชม.`} />
              <InfoCard label="Sections" value={`${sections.length}`} sub="เทอมนี้" />
              <InfoCard label="ลงทะเบียน" value={`${sections.reduce((s, sec) => s + sec.enrolledCount, 0)}`} sub={`/${sections.reduce((s, sec) => s + sec.capacity, 0)} คน`} />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Bottom Section — 3/5 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Sections ทั้งหมด ({sections.length})
            </h3>
            <span className="text-[12px] text-muted-foreground">ภาคเรียน 1/2569 (Mock)</span>
          </div>

          {sections.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground">ยังไม่มี Section สำหรับวิชานี้</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map(sec => {
                const pct = Math.round(sec.enrolledCount / sec.capacity * 100);
                const isFull = sec.enrolledCount >= sec.capacity;
                const isNearFull = pct >= 90 && !isFull;
                return (
                  <div
                    key={sec.id}
                    onClick={() => router.push(`/admin/courses/${courseId}/sections/${sec.id}`)}
                    className={`bg-card rounded-2xl p-5 border-2 hover:shadow-lg transition-all cursor-pointer group ${
                      isFull ? 'border-red-300 dark:border-red-700' : isNearFull ? 'border-amber-300 dark:border-amber-700' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[18px]">Sec {sec.sectionNo}</span>
                        {isFull && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">เต็ม</span>}
                        {isNearFull && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">ใกล้เต็ม</span>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{sec.day} {sec.startTime}—{sec.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{sec.room}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sec.professorName}</span>
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">ความจุ</span>
                        <span className={isFull ? 'text-red-500' : ''}>{sec.enrolledCount}/{sec.capacity}</span>
                      </div>
                      <div className="h-2 rounded-full bg-accent overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-3 border border-border/50">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[18px] mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
