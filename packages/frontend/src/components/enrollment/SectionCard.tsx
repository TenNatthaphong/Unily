import { useTranslation } from '../../i18n/useTranslation';
import type { Section, SemesterConfig } from '../../types';
import { Users, Clock, BookOpen, User } from 'lucide-react';
import './SectionCard.css';

interface SectionCardProps {
  section: Section;
  config: SemesterConfig | null;
  isEnrolled: boolean;
  onEnroll: (id: string) => void;
  onDrop: (id: string) => void;
  isLoading?: boolean;
}

export default function SectionCard({ section, config, isEnrolled, onEnroll, onDrop, isLoading }: SectionCardProps) {
  const { t } = useTranslation();

  const capacityPercent = (section.enrolledCount / section.capacity) * 100;
  const statusColor = capacityPercent >= 100 ? 'red' : capacityPercent >= 70 ? 'yellow' : 'green';

  // Time-gating logic
  const now = new Date();
  const regStart = config ? new Date(config.regStart) : null;
  const regEnd = config ? new Date(config.regEnd) : null;
  const withdrawEnd = config ? new Date(config.withdrawEnd) : null;

  const canRegister = regStart && regEnd && now >= regStart && now <= regEnd;
  const canWithdraw = regStart && withdrawEnd && now >= regStart && now <= withdrawEnd;

  return (
    <div className={`card section-card ${isEnrolled ? 'enrolled' : ''}`}>
      <div className="section-card-header">
        <div className="course-info">
          <span className="course-code">{section.course?.courseCode}</span>
          <span className="badge badge-info">{section.course?.category.replace('_', ' ')}</span>
        </div>
        <h4 className="course-name">{section.course?.nameTh}</h4>
        <p className="course-name-en">{section.course?.nameEn}</p>
      </div>

      <div className="section-card-body">
        <div className="info-grid">
          <div className="info-item">
            <Users size={16} className="item-icon" />
            <span>{t('enrollment.section')} {section.sectionNo}</span>
          </div>
          <div className="info-item">
            <User size={16} className="item-icon" />
            <span className="truncate">{section.professor?.user?.firstName} {section.professor?.user?.lastName}</span>
          </div>
          <div className="info-item">
            <BookOpen size={16} className="item-icon" />
            <span>{section.course?.credits} {t('dashboard.total_credits')}</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="capacity-container">
          <div className="capacity-labels">
            <span>{t('enrollment.capacity')}</span>
            <span className={`status-text ${statusColor}`}>
              {section.enrolledCount} / {section.capacity}
            </span>
          </div>
          <div className="capacity-bar">
            <div
              className={`capacity-bar-fill ${statusColor}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Schedule List */}
        <div className="schedule-mini-list">
          {section.schedules?.map((sch, i) => (
            <div key={i} className="schedule-mini-item">
              <Clock size={14} className="item-icon" />
              <span className={`day-tag day-${sch.dayOfWeek.toLowerCase()}`}>{sch.dayOfWeek}</span>
              <span>{sch.startTime} - {sch.endTime}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card-footer">
        {isEnrolled ? (
          <button
            className="btn btn-danger w-full"
            onClick={() => onDrop(section.id)}
            disabled={!canWithdraw || isLoading}
          >
            {isLoading ? t('common.loading') : t('enrollment.drop')}
          </button>
        ) : (
          <button
            className="btn btn-primary w-full"
            onClick={() => onEnroll(section.id)}
            disabled={!canRegister || section.enrolledCount >= section.capacity || isLoading}
          >
            {isLoading ? t('common.loading') : t('enrollment.enroll')}
          </button>
        )}
      </div>

      {!canRegister && !isEnrolled && (
        <div className="time-warning-overlay">
          <span>{t('enrollment.period_ended')}</span>
        </div>
      )}
    </div>
  );
}
