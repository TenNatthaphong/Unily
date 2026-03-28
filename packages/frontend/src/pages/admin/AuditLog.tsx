import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AuditLog, Action } from '../../types';
import { ScrollText, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/ui/Pagination';
import './AuditLog.css';

const ACTION_TH: Record<Action, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
};

const ACTION_CONFIG: Record<Action, { className: string }> = {
  CREATE: { className: 'action-create' },
  UPDATE: { className: 'action-update' },
  DELETE: { className: 'action-delete' },
};

const FILTER_LABELS: { value: Action | ''; label: string; activeColor: string }[] = [
  { value: '', label: 'ทั้งหมด', activeColor: 'var(--primary)' },
  { value: 'CREATE', label: 'สร้าง', activeColor: 'var(--success)' },
  { value: 'UPDATE', label: 'แก้ไข', activeColor: 'var(--warning)' },
  { value: 'DELETE', label: 'ลบ', activeColor: 'var(--danger)' },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<Action | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await adminApi.getAuditLogs({
        page, adminName: search || undefined,
        action: actionFilter || undefined,
        limit: 20,
      });
      setLogs(r.data.data);
      setLastPage(r.data.meta.lastPage);
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
    finally { setIsLoading(false); }
  }, [page, search, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="page-title"><ScrollText size={24} /><h1>ประวัติการใช้งาน</h1></div>
      </div>

      <div className="page-filters">
        <div className="search-box"><Search size={16} />
          <input placeholder="ค้นหาด้วยชื่อแอดมิน..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="action-toggles">
          {FILTER_LABELS.map(({ value, label, activeColor }) => (
            <button
              key={value}
              onClick={() => { setActionFilter(value); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: actionFilter === value ? activeColor : 'var(--bg-surface)',
                color: actionFilter === value ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: actionFilter === value ? `0 4px 12px ${activeColor}40` : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="loading-state"><Loader2 className="spin" size={32} /></div> : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead><tr>
                <th>แอดมิน</th><th>กิจกรรม</th><th>เป้าหมาย</th><th>เวลา</th>
              </tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500 }}>{log.adminName}</td>
                    <td>
                      <span className={`action-badge ${ACTION_CONFIG[log.action]?.className}`}>
                        {ACTION_TH[log.action] ?? log.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.target}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={page} 
            lastPage={lastPage} 
            onPageChange={setPage} 
          />
        </>
      )}
    </div>
  );
}
