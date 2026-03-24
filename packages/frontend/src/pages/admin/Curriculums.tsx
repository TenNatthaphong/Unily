import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '../../components/ui/Portal';
import { useNavigate } from 'react-router-dom';
import { curriculumApi } from '../../api/curriculum.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Curriculum, Faculty, Department } from '../../types';
import { Plus, Pencil, Trash2, Loader2, GraduationCap, GitBranch, BookOpen, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Curriculums.css';

type FormData = {
  curriculumCode: string;
  name: string;
  description: string;
  year: number;
  totalCredits: number;
  facultyId: string;
  deptId: string;
};
const emptyForm: FormData = {
  curriculumCode: '',
  name: '',
  description: '',
  year: new Date().getFullYear() + 543,
  totalCredits: 128,
  facultyId: '',
  deptId: '',
};

const STATUS_TH: Record<string, string> = {
  ACTIVE: 'ใช้งาน',
  INACTIVE: 'ปิดใช้งาน',
  DRAFT: 'ร่าง',
};

export default function AdminCurriculums() {
  const navigate = useNavigate();
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Curriculum | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    Promise.all([
      curriculumApi.search({}),
      facultyApi.getAll(),
    ]).then(([cr, fr]) => {
      setCurriculums(cr.data);
      setFaculties(fr.data);
      setIsLoading(false);
    }).catch(() => {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      departmentApi.getByFaculty(form.facultyId).then(r => setDepartments(r.data));
    } else {
      setDepartments([]);
    }
  }, [form.facultyId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Curriculum) => {
    setEditing(c);
    setForm({
      curriculumCode: c.curriculumCode,
      name: c.name,
      description: c.description || '',
      year: c.year,
      totalCredits: c.totalCredits,
      facultyId: c.facultyId,
      deptId: c.deptId,
    });
    setShowModal(true);
  };

  const submit = async () => {
    if (!form.curriculumCode || !form.name || !form.facultyId || !form.deptId) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      if (editing) {
        const r = await curriculumApi.update(editing.id, form);
        setCurriculums(p => p.map(c => c.id === editing.id ? r.data : c));
        toast.success('แก้ไขหลักสูตรสำเร็จ');
      } else {
        const r = await curriculumApi.create(form);
        setCurriculums(p => [...p, r.data]);
        toast.success('เพิ่มหลักสูตรสำเร็จ');
      }
      setShowModal(false);
    } catch { toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
  };

  const deleteCurriculum = async (id: string) => {
    if (!confirm('ต้องการลบหลักสูตรนี้ใช่หรือไม่?')) return;
    try {
      await curriculumApi.delete(id);
      setCurriculums(p => p.filter(c => c.id !== id));
      toast.success('ลบหลักสูตรสำเร็จ');
    } catch { toast.error('ลบไม่สำเร็จ'); }
  };

  if (isLoading) return (
    <div className="loading-state">
      <Loader2 className="spin" size={40} />
      <p>กำลังโหลดหลักสูตร...</p>
    </div>
  );

  return (
    <div className="admin-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="page-title">
          <GraduationCap size={24} />
          <h1>หลักสูตร</h1>
          <span className="badge">{curriculums.length} รายการ</span>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={openAdd}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} /> เพิ่มหลักสูตร
        </motion.button>
      </motion.div>

      {curriculums.length === 0 ? (
        <motion.div
          className="empty-state card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <GraduationCap size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีหลักสูตร กรุณาเพิ่มหลักสูตรใหม่</p>
        </motion.div>
      ) : (
        <motion.div
          className="curriculum-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {curriculums.map(c => (
            <motion.div
              key={c.id}
              className="curriculum-card card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
              whileHover={{ translateY: -4 }}
            >
              <div className="curriculum-card-header">
                <span className="badge">{c.curriculumCode}</span>
                <span className={`status-badge ${c.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                  {STATUS_TH[c.status] ?? c.status}
                </span>
              </div>
              <h3 className="curriculum-name">{c.name}</h3>
              <div className="curriculum-meta">
                <span className="meta-item"><BookOpen size={12} /> ปี {c.year}</span>
                <span className="meta-item"><Users size={12} /> {c.totalCredits} หน่วยกิต</span>
              </div>
              {c.description && (
                <p className="curriculum-desc">{c.description}</p>
              )}
              <div className="curriculum-actions">
                <motion.button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/admin/curriculums/${c.id}/flow`)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <GitBranch size={13} /> แผนการเรียน
                </motion.button>
                <motion.button
                  className="btn-icon edit"
                  onClick={() => openEdit(c)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title="แก้ไข"
                >
                  <Pencil size={14} />
                </motion.button>
                <motion.button
                  className="btn-icon delete"
                  onClick={() => deleteCurriculum(c.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title="ลบ"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <Portal>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className="modal modal-lg"
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                onClick={e => e.stopPropagation()}
              >
                <h3>{editing ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรใหม่'}</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>รหัสหลักสูตร</label>
                    <input
                      placeholder="เช่น CS-2567"
                      value={form.curriculumCode}
                      onChange={e => setForm(p => ({ ...p, curriculumCode: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>ปีหลักสูตร (พ.ศ.)</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={e => setForm(p => ({ ...p, year: +e.target.value }))}
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>ชื่อหลักสูตร</label>
                    <input
                      placeholder="ชื่อหลักสูตร"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>รายละเอียด</label>
                    <textarea
                      rows={2}
                      placeholder="คำอธิบายหลักสูตร (ถ้ามี)"
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>หน่วยกิตรวม</label>
                    <input
                      type="number"
                      value={form.totalCredits}
                      onChange={e => setForm(p => ({ ...p, totalCredits: +e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>คณะ</label>
                    <select
                      value={form.facultyId}
                      onChange={e => setForm(p => ({ ...p, facultyId: e.target.value, deptId: '' }))}
                    >
                      <option value="">-- เลือกคณะ --</option>
                      {faculties.map(f => (
                        <option key={f.id} value={f.id}>{f.nameTh || f.nameEn}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ภาควิชา / สาขา</label>
                    <select
                      value={form.deptId}
                      disabled={!form.facultyId}
                      onChange={e => setForm(p => ({ ...p, deptId: e.target.value }))}
                    >
                      <option value="">-- เลือกภาควิชา --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.nameTh || d.nameEn}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
                  <motion.button
                    className="btn btn-primary"
                    onClick={submit}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {editing ? 'บันทึกการแก้ไข' : 'เพิ่มหลักสูตร'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}
