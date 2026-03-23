import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { adminApi } from '../../api/admin.api';
import { configApi } from '../../api/config.api';
import type { SemesterConfig, Event } from '../../types';
import { 
  ShieldAlert, Settings, FileUp, Calendar, 
  Trash2, Plus, Clock, Loader2, AlertTriangle, 
  Database, UserPlus 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingSem, setIsClosingSem] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [confRes, evRes] = await Promise.all([
          configApi.getCurrentSemester(),
          configApi.getEvents()
        ]);
        setConfig(confRes.data);
        setEvents(evRes.data);
      } catch (err) {
        toast.error('Failed to load system state');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCloseSemester = async () => {
    if (!config) return;
    setIsClosingSem(true);
    toast.promise(adminApi.closeSemester(config.academicYear, config.semester), {
      loading: 'Closing semester & processing grades...',
      success: 'Semester closed successfully!',
      error: 'Failed to close semester'
    }).finally(() => setIsClosingSem(false));
  };

  const onImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.promise(adminApi.importUsersCsv(file), {
      loading: 'Importing users...',
      success: 'Import success!',
      error: 'Import failed'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="dashboard-header">
        <h1>{t('nav.settings')}</h1>
        <p className="welcome-msg">System Control Center</p>
      </div>

      <div className="admin-grid">
        {/* Current State Column */}
        <div className="admin-main">
          <div className="card system-pulse-card">
            <div className="card-header">
              <Database size={20} />
              <h4>{t('nav.semester_config')}</h4>
              <span className={`status-badge ${config?.isCurrent ? 'active' : ''}`}>
                {config?.isCurrent ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">Year / Semester</span>
                <span className="config-value">{config?.academicYear} / {config?.semester}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Registration</span>
                <span className="config-value">{config ? new Date(config.regStart).toLocaleDateString() : 'N/A'} - {config ? new Date(config.regEnd).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="card maintenance-card mt-lg">
            <div className="card-header">
              <ShieldAlert size={20} />
              <h4>Maintenance Actions</h4>
            </div>
            <div className="action-row">
              <div className="action-item">
                <div className="action-info">
                  <UserPlus size={24} />
                  <div className="action-text">
                    <h5>Bulk User Import</h5>
                    <p>Register hundreds of students/professors via CSV</p>
                  </div>
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <FileUp size={16} />
                  {t('nav.import_csv')}
                  <input type="file" hidden accept=".csv" onChange={onImportCsv} />
                </label>
              </div>

              <div className="action-item danger">
                <div className="action-info">
                  <AlertTriangle size={24} />
                  <div className="action-text">
                    <h5>{t('nav.semester_close')}</h5>
                    <p>Trigger grading process for current term. <b>This cannot be undone.</b></p>
                  </div>
                </div>
                <button 
                  className="btn btn-danger" 
                  onClick={handleCloseSemester}
                  disabled={isClosingSem}
                >
                  <Clock size={16} />
                  Run Closing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar/Events */}
        <div className="admin-sidebar">
          <div className="card events-mgr-card">
            <div className="card-header">
              <Calendar size={20} />
              <h4>System Events</h4>
              <button className="btn-icon circle-btn primary">
                <Plus size={16} />
              </button>
            </div>
            <div className="admin-events-list">
              {events.map(ev => (
                <div key={ev.id} className="admin-event-item">
                  <div className="event-main">
                    <span className="event-name">{ev.title}</span>
                    <span className="event-date">{new Date(ev.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="event-actions">
                    <button className="btn-icon delete"><Trash2 size={16} /></button>
                    <button className="btn-icon edit"><Settings size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
