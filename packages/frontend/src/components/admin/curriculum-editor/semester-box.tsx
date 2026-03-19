// src/components/admin/curriculum-editor/semester-box.tsx
'use client';
import { useDrop } from 'react-dnd';
import { CourseCard } from './course-card';

export function SemesterBox({ semester, items, onMove }: any) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COURSE',
    drop: (item: any) => onMove(item, semester),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={node => { drop(node); }}
      className={`flex flex-col rounded-xl p-4 min-h-[200px] transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : 'bg-gray-100/60'
      }`}
    >
      <h3 className="text-sm font-bold text-gray-600 mb-3 px-1 italic">Semester {semester}</h3>
      <div className="flex-1 space-y-2">
        {items.map((item: any) => (
          <CourseCard key={item.id} course={item} />
        ))}
      </div>
    </div>
  );
}