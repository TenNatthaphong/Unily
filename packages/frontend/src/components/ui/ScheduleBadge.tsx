import React from 'react';
import { DAY_CONFIG } from '../../types/day';
import type { Schedule, DayOfWeek } from '../../types/index';
import './ScheduleBadge.css';

interface Props {
  schedule: Schedule | { dayOfWeek: DayOfWeek; startTime: string; endTime: string; id?: string };
  size?: 'sm' | 'md';
  className?: string;
  prefix?: React.ReactNode;
}

export function ScheduleBadge({ schedule, size = 'md', className = '', prefix }: Props) {
  const d = DAY_CONFIG[schedule.dayOfWeek];
  if (!d) return null;
  
  return (
    <span 
      className={`sched-tag ${size === 'sm' ? 'sm' : ''} ${className}`}
      style={{ 
        background: `${d.color}25`, 
        color: d.color,
        borderLeft: `${size === 'sm' ? '4px' : '5px'} solid ${d.color}`,
        paddingLeft: size === 'sm' ? '6px' : '8px'
      }}
    >
      {prefix && <span style={{ marginRight: 4 }}>{prefix}</span>}
      <span style={{ fontWeight: 800 }}>{d.short}</span> 
      <span>{schedule.startTime}–{schedule.endTime}</span>
    </span>
  );
}
