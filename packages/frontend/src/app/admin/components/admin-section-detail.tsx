import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  ChevronLeft, Edit2, Save, X, User, Clock, MapPin, Users, GraduationCap,
  BookOpen, Hash, Calendar
} from 'lucide-react';
import { mockSectionsDetailed, mockStudentsForSection, type MockStudent } from "@/app/admin/components/admin-shared";

export function AdminSectionDetail() {
  const { courseId, sectionId } = useParams();
  const router = useRouter();
  const section = mockSectionsDetailed.find(s => s.id === sectionId);
  const [isEditing, setIsEditing] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-[14px] text-muted-foreground">ไม่พบ Section นี้</p>
          <button onClick={() => router.push(`/admin/courses/${courseId}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px]">
            <ChevronLeft className="w-4 h-4" />กลับ
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round(section.enrolledCount / section.capacity * 100);
  const isFull = section.enrolledCount >= section.capacity;

  const filteredStudents = mockStudentsForSection.filter(s => {
    const matchSearch = s.name.includes(searchStudent) || s.studentId.includes(searchStudent);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusConfig = {
    enrolled: { label: 'ลงทะเบียน', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    dropped: { label: 'ถอน', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    withdrawn: { label: 'W', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => router.push(`/admin/courses/${courseId}`)} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
        กลับหน้ารายวิชา {courseId}
      </button>

      {/* Section Header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Hash className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-[22px]">{courseId} — Section {section.sectionNo}</h1>
              <p className="text-[14px] text-muted-foreground">ภาคเรียน {section.semester}/{section.academicYear}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[13px]"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'ยกเลิก' : 'แก้ไข'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DetailField icon={<User className="w-4 h-4" />} label="อาจารย์ผู้สอน" value={section.professorName} editing={isEditing} />
          <DetailField icon={<Clock className="w-4 h-4" />} label="เวลาเรียน" value={`${section.day} ${section.startTime}—${section.endTime}`} editing={isEditing} />
          <DetailField icon={<MapPin className="w-4 h-4" />} label="ห้องเรียน" value={section.room} editing={isEditing} />
          <DetailField icon={<Users className="w-4 h-4" />} label="ความจุ" value={`${section.enrolledCount}/${section.capacity}`} editing={isEditing} />
        </div>

        {/* Capacity Bar */}
        <div className="mt-4">
          <div className="h-3 rounded-full bg-accent overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{pct}% ของความจุ {isFull ? '— เต็มแล้ว' : ''}</p>
        </div>

        {isEditing && (
          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[13px]">
              <Save className="w-4 h-4" />
              บันทึกการแก้ไข
            </button>
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="text-[18px] flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            รายชื่อนักศึกษา ({mockStudentsForSection.length} คน)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสนักศึกษา..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent/50 border-2 border-border focus:border-primary transition-all outline-none text-[13px]"
            />
            <div className="flex gap-1.5">
              {(['all', 'enrolled', 'dropped', 'withdrawn'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {s === 'all' ? 'ทั้งหมด' : statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground w-8">#</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">รหัส</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">ชื่อ-สกุล</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">ชั้นปี</th>
                <th className="text-left px-5 py-3 text-[12px] text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st, idx) => (
                <tr key={st.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{idx + 1}</td>
                  <td className="px-5 py-3 text-[13px] text-primary">{st.studentId}</td>
                  <td className="px-5 py-3 text-[14px]">{st.name}</td>
                  <td className="px-5 py-3 text-[13px]">ปี {st.year}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${statusConfig[st.status].color}`}>
                      {statusConfig[st.status].label}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-[14px]">ไม่พบนักศึกษา</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailField({ icon, label, value, editing }: { icon: React.ReactNode; label: string; value: string; editing: boolean }) {
  return (
    <div className="bg-accent/30 rounded-xl p-4 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      {editing ? (
        <input
          defaultValue={value}
          className="w-full px-3 py-2 rounded-lg border-2 border-border bg-card focus:border-primary outline-none text-[14px]"
        />
      ) : (
        <p className="text-[14px]">{value}</p>
      )}
    </div>
  );
}
