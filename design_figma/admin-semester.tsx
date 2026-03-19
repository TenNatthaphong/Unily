import { useState } from 'react';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';

interface SemesterConfig {
  id: string;
  semester: number;
  academicYear: number;
  isCurrent: boolean;
}

export function AdminSemester() {
  const [semesters, setSemesters] = useState<SemesterConfig[]>([
    { id: 's1', semester: 1, academicYear: 2025, isCurrent: true },
    { id: 's2', semester: 2, academicYear: 2025, isCurrent: false },
    { id: 's3', semester: 3, academicYear: 2025, isCurrent: false },
    { id: 's4', semester: 1, academicYear: 2024, isCurrent: false },
    { id: 's5', semester: 2, academicYear: 2024, isCurrent: false },
  ]);

  const handleSetCurrent = (id: string) => {
    setSemesters(prev => prev.map(s => ({ ...s, isCurrent: s.id === id })));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-[24px]">ตั้งค่าภาคเรียน</h1>
      <p className="text-[14px] text-muted-foreground">เลือกภาคเรียนปัจจุบันสำหรับการลงทะเบียน</p>

      <div className="space-y-3">
        {semesters.map(sem => (
          <div
            key={sem.id}
            className={`bg-card rounded-2xl p-5 border-2 flex items-center justify-between transition-all cursor-pointer hover:shadow-md ${
              sem.isCurrent ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onClick={() => handleSetCurrent(sem.id)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                sem.isCurrent ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
              }`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[15px]">ภาคเรียนที่ {sem.semester}/{sem.academicYear}</p>
                <p className="text-[13px] text-muted-foreground">
                  ปีการศึกษา {sem.academicYear}
                </p>
              </div>
            </div>
            {sem.isCurrent ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[13px]">ปัจจุบัน</span>
              </div>
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
