import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AuditLog, Action } from '../../types';
import { ScrollText, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './AuditLog.css';

const ACTION_CONFIG: Record<Action, { label: string; className: string }> = {
  CREATE: { label: 'CREATE', className: 'action-create' },
  UPDATE: { label: 'UPDATE', className: 'action-update' },
  DELETE: { label: 'DELETE', className: 'action-delete' },
};

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
    } catch { toast.error('Failed to load audit logs'); }
    finally { setIsLoading(false); }
  }, [page, search, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="admin-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><ScrollText size={24} /><h1>Audit Log</h1></div>
      </div>

      <div className="page-filters">
        <div className="search-box"><Search size={16} />
          <input placeholder="Search by admin name..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="action-toggles">
          {(['', 'CREATE', 'UPDATE', 'DELETE'] as const).map(a => (
            <button
              key={a}
              className={`action-toggle ${actionFilter === a ? 'active' : ''} ${a ? ACTION_CONFIG[a as Action].className : ''}`}
              onClick={() => { setActionFilter(a); setPage(1); }}
            >
              {a || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="loading-state"><Loader2 className="spin" size={32} /></div> : (
        <>
          <div className="data-table">
            <table>
              <thead><tr>
                <th>Admin</th><th>Action</th><th>Target</th><th>Timestamp</th>
              </tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="font-medium">{log.adminName}</td>
                    <td>
                      <span className={`action-badge ${ACTION_CONFIG[log.action]?.className}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="text-secondary">{log.target}</td>
                    <td className="text-muted text-sm">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </>
      )}
    </div>
  );
}
