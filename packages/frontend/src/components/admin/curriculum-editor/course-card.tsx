// src/components/admin/curriculum-editor/course-card.tsx
'use client';
import { useDrag } from 'react-dnd';

export function CourseCard({ course, isSidebar = false }: any) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COURSE',
    item: { ...course, type: isSidebar ? 'NEW' : 'EXISTING' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const displayId = course.courseId || course.id;
  const displayName = course.course?.name || course.name;
  const displayCredit = course.course?.credit || course.credit;

  return (
    <div
      ref={node => { drag(node); }}
      className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-blue-400 ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
    >
      <div className="text-[10px] font-bold text-blue-600 mb-0.5">{displayId}</div>
      <div className="text-sm font-semibold text-gray-800 truncate">{displayName}</div>
      <div className="text-[10px] text-gray-500 mt-1">{displayCredit} Credits</div>
    </div>
  );
}