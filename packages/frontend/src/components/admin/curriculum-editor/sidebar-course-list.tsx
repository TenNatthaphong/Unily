'use client';
import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import axios from 'axios';

export function SidebarCourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึง 100 วิชาแรกมาแสดงก่อน
    axios.get('http://localhost:3333/course?limit=100')
      .then(res => {
        setCourses(res.data.data); // Backend คืนค่า { data, meta }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-400">กำลังโหลดวิชา...</div>;

  return (
    <div className="space-y-2">
      {courses.map((course: any) => (
        <SidebarItem key={course.id} course={course} />
      ))}
    </div>
  );
}

export function SidebarItem({ course }: { course: any }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COURSE',
    item: { ...course, type: 'NEW' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={(node) => { drag(node); }}
      className={`p-3 mb-2 rounded bg-gray-50 border border-gray-200 cursor-grab hover:border-blue-400 hover:shadow-md transition-all ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div className="text-xs font-bold text-gray-500">{course.id}</div>
      <div className="text-sm font-medium">{course.nameEn}</div>
      <div className="text-[10px] text-gray-400">{course.credits} หน่วยกิต</div>
    </div>
  );
}