import { useState } from 'react';
import type { Course } from '../../types';
import { Search, GripVertical } from 'lucide-react';

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
      </div>
      <div className="palette-search">
        <Search size={14} />
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="palette-list">
        {filtered.map(c => (
          <div
            key={c.id}
            className={`palette-item ${c.isWildcard ? 'wildcard' : ''}`}
            draggable
            onDragStart={e => onDragStart(e, c)}
          >
            <GripVertical size={12} className="drag-handle" />
            <div className="palette-item-info">
              <span className="palette-code">{c.courseCode}</span>
              <span className="palette-name">{c.nameTh}</span>
            </div>
            <span className="palette-cat">{CAT_LABELS[c.category] || c.category}</span>
          </div>
        ))}
        {filtered.length === 0 && <p className="palette-empty">No courses found</p>}
      </div>
    </div>
  );
}
