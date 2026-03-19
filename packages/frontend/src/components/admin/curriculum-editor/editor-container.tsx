// src/components/admin/curriculum-editor/editor-container.tsx
'use client';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SemesterBox } from './semester-box';
import { CourseCard } from './course-card';
import axios from 'axios';

export function EditorContainer({ curriculumId, initialItems, allCourses }: any) {
  const [items, setItems] = useState(initialItems);

  const handleMove = async (draggedItem: any, newSemester: number) => {
    if (draggedItem.type === 'NEW') {
      try {
        const res = await axios.post(`http://localhost:3333/curriculum-item`, {
          curriculumId, courseId: draggedItem.id, semester: newSemester,
          year: Math.ceil(newSemester / 2), positionX: 0, positionY: 0
        });
        setItems((prev: any) => [...prev, res.data]);
      } catch (err) { alert('วิชานี้มีอยู่ในแผนแล้ว'); }
    } else {
      setItems((prev: any) => prev.map((it: any) => it.id === draggedItem.id ? { ...it, semester: newSemester } : it));
      await axios.patch(`http://localhost:3333/curriculum-item/${draggedItem.id}`, { semester: newSemester });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar ดีไซน์เดิม: วิชาที่เลือกได้ */}
        <aside className="w-72 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Course Library</h2>
            <input type="text" placeholder="Search course..." className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {allCourses.map((c: any) => (
              <CourseCard key={c.id} course={c} isSidebar={true} />
            ))}
          </div>
        </aside>

        {/* Grid 8 เทอม: ขวามือ */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <SemesterBox key={sem} semester={sem} items={items.filter((it: any) => it.semester === sem)} onMove={handleMove} />
            ))}
          </div>
        </main>
      </div>
    </DndProvider>
  );
}