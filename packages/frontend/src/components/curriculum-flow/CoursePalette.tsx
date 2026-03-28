import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Course } from '../../types';
import { Search, GripVertical, Info } from 'lucide-react';

interface Props {
  courses: Course[];
}

const CAT_LABELS: Record<string, string> = {
  GENERAL_EDUCATION: 'GE',
  CORE_COURSE: 'Core',
  REQUIRED_COURSE: 'Req.',
  MAJOR_ELECTIVE: 'M-Elec',
  FREE_ELECTIVE: 'F-Elec',
  COOP_COURSE: 'Co-op',
};

const CAT_COLORS: Record<string, string> = {
  GENERAL_EDUCATION: '#60a5fa',
  CORE_COURSE: '#a78bfa',
  REQUIRED_COURSE: '#34d399',
  MAJOR_ELECTIVE: '#fbbf24',
  FREE_ELECTIVE: '#9ca3af',
  COOP_COURSE: '#f87171',
};

export default function CoursePalette({ courses }: Props) {
  const [search, setSearch] = useState('');

  const filtered = courses.filter(c =>
    c.courseCode.toLowerCase().includes(search.toLowerCase()) ||
    c.nameTh.toLowerCase().includes(search.toLowerCase())
  );

  const onDragStart = (e: React.DragEvent, course: Course) => {
    e.dataTransfer.setData('application/coursenode', JSON.stringify({
      courseId: course.id,
      courseCode: course.courseCode,
      nameTh: course.nameTh,
      credits: course.credits,
      category: course.category,
      isWildcard: course.isWildcard,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="course-palette">
      <div className="palette-header">
        <h4>Course Palette</h4>
        <div className="palette-search">
          <Search size={14} className="search-icon" />
          <input 
            placeholder="รหัส หรือ ชื่อวิชา..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="palette-list">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.2) }}
              className={`palette-item ${c.isWildcard ? 'wildcard' : ''}`}
              draggable
              onDragStart={e => onDragStart(e as unknown as React.DragEvent, c)}
            >
              <div className="drag-indicator" style={{ background: CAT_COLORS[c.category] || 'var(--primary)' }} />
              <GripVertical size={14} className="drag-handle" />
              <div className="palette-item-info">
                <span className="palette-code">{c.courseCode}</span>
                <span className="palette-name" title={c.nameTh}>{c.nameTh}</span>
              </div>
              <span className="palette-cat-tag" style={{ color: CAT_COLORS[c.category] }}>
                {CAT_LABELS[c.category] || c.category}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="palette-empty">
            <Info size={24} />
            <p>ไม่พบรายวิชา</p>
          </div>
        )}
      </div>
    </div>
  );
}
