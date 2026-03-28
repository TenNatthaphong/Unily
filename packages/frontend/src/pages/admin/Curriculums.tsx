import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { curriculumApi } from '../../api/curriculum.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Curriculum, Faculty, Department } from '../../types';
import { 
  Plus, Pencil, Trash2, GraduationCap, 
  GitBranch, FileUp, Search,
  ChevronRight, Info, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Curriculums.css';

export default function AdminCurriculums() {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedFacs, setExpandedFacs] = useState<Record<string, boolean>>({});
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [deptsMap, setDeptsMap] = useState<Record<string, Department[]>>({});
  const [currsMap, setCurrsMap] = useState<Record<string, Curriculum[]>>({});

  const fetchFaculties = useCallback(async () => {
    setIsLoading(true);
    try {
      const fr = await facultyApi.getAll();
      const facList = fr.data;
      setFaculties(Array.isArray(facList) ? facList : (facList as any).data || []);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลคณะได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaculties(); }, [fetchFaculties]);

  const toggleFac = async (fid: string) => {
    const next = !expandedFacs[fid];
    setExpandedFacs(p => ({ ...p, [fid]: next }));
    if (next && !deptsMap[fid]) {
      const r = await departmentApi.getByFaculty(fid);
      setDeptsMap(p => ({ ...p, [fid]: r.data }));
    }
  };

  const toggleDept = async (did: string) => {
    const next = !expandedDepts[did];
    setExpandedDepts(p => ({ ...p, [did]: next }));
    if (next && !currsMap[did]) {
      const r = await curriculumApi.search({ deptId: did, limit: 100 });
      setCurrsMap(p => ({ ...p, [did]: r.data.data }));
    }
  };

  const onImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tid = toast.loading('กำลังนำเข้าหลักสูตร...');
    curriculumApi.importCsv(file)
      .then(() => {
        toast.success('นำเข้าข้อมูลสำเร็จ', { id: tid });
        fetchFaculties();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'นำเข้าไม่สำเร็จ', { id: tid }));
  };

  const deleteCurriculum = async (id: string, code: string, deptId: string) => {
    if (!window.confirm(`ต้องการลบหลักสูตร ${code} ใช่หรือไม่?`)) return;
    try {
      await curriculumApi.delete(id);
      setCurrsMap(p => ({
        ...p,
        [deptId]: p[deptId]?.filter(c => c.id !== id) || []
      }));
      // Reset deptsMap to force refresh counts when re-opened
      setDeptsMap({});
      await fetchFaculties(); 
      toast.success('ลบหลักสูตรสำเร็จ');
    } catch { toast.error('ไม่สามารถลบหลักสูตรได้'); }
  };

  return (
    <div className="admin-page animate-fade-in curr-page">
      <div className="page-header">
        <div className="page-title">
          <GraduationCap size={24} />
          <h1>จัดการหลักสูตร</h1>
          <span className="badge">Curriculum Admin</span>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <label className="btn btn-import csv-btn" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileUp size={16} /> นำเข้า CSV
            <input type="file" hidden accept=".csv" onChange={onImportCsv} />
          </label>
          <button className="btn btn-primary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/admin/curriculums/new/flow')}>
            <Plus size={16} /> เพิ่มหลักสูตร
          </button>
        </div>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={18} />
          <input 
            placeholder="ค้นหาคณะหรือรหัส..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state-mini"><Loader2 className="spin" size={40} /><p>กำลังโหลดข้อมูลต้นพิกัด...</p></div>
      ) : (
      <div className="org-list">
        {faculties.map(f => {
          if (search && !f.nameTh.includes(search) && !f.facultyCode.includes(search)) return null;
          const isExpanded = expandedFacs[f.id];
          return (
            <div key={f.id} className={`org-card card ${isExpanded ? 'expanded' : ''}`}>
              <div className="org-row" onClick={() => toggleFac(f.id)}>
                <div className="org-main">
                  <div className={`exp-icon ${isExpanded ? 'active' : ''}`}>
                    <ChevronRight size={18} />
                  </div>
                  <div className="org-identity">
                    <span className="org-code">{f.facultyCode}</span>
                    <div className="org-text">
                      <h3 className="org-name-th">{f.nameTh}</h3>
                    </div>
                  </div>
                </div>
                <div className="org-meta">
                   <div className="org-counts">
                     <span className="org-count-item">{f._count?.departments || 0} สาขา</span>
                     <span className="org-count-item main">{f._count?.curriculums || 0} หลักสูตร</span>
                   </div>
                </div>
              </div>

              {isExpanded && (
                <div className="dept-section">
                  <div className="dept-container">
                    {(deptsMap[f.id] || []).map(d => {
                      const isDeptExpanded = expandedDepts[d.id];
                      return (
                        <div key={`dept-${f.id}-${d.id}`} className={`dept-group ${isDeptExpanded ? 'expanded' : ''}`}>
                          <div className="dept-item" onClick={() => toggleDept(d.id)}>
                             <div className="dept-info">
                               <div className={`exp-icon sm ${isDeptExpanded ? 'active' : ''}`}>
                                 <ChevronRight size={14} />
                               </div>
                               <span className="dept-code">{d.deptCode}</span>
                               <span className="dept-name">{d.nameTh}</span>
                             </div>
                             <div className="dept-meta">
                               <span className="cc-count">{d._count?.curriculums || 0} หลักสูตร</span>
                             </div>
                          </div>

                          {isDeptExpanded && (
                            <div className="curr-sub-list">
                               {currsMap[d.id]?.map(c => (
                                 <div key={c.id} className="curr-row">
                                    <div className="curr-info">
                                      <span className="curr-c-code">{c.curriculumCode}</span>
                                      <span className="curr-c-name">{c.name}</span>
                                      <span className="curr-c-year">พ.ศ. {c.year}</span>
                                    </div>
                                     <div className="curr-row-actions">
                                       <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/curriculums/${c.id}/flow`)}>
                                         <GitBranch size={14} /> จัดการหลักสูตร
                                       </button>
                                       <button className="btn-icon sm delete" onClick={() => deleteCurriculum(c.id, c.curriculumCode, d.id)}><Trash2 size={14} /></button>
                                    </div>
                                 </div>
                               ))}
                               {currsMap[d.id]?.length === 0 && <div className="empty-mini">ไม่มีหลักสูตรในสาขานี้</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {deptsMap[f.id]?.length === 0 && <div className="dept-empty">ไม่พบข้อมูลสาขาวิชา</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
