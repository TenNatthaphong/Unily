import { useState, useEffect } from 'react';
import { academicRecordApi, type GraduationStatus } from '../../api/academic-record.api';
import { GraduationCap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './GraduationCheck.css';

export default function GraduationCheck() {
  const [status, setStatus] = useState<GraduationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    academicRecordApi.getMyGraduation()
      .then(r => { setStatus(r.data); setIsLoading(false); })
      .catch(() => { toast.error('Failed to load graduation status'); setIsLoading(false); });
  }, []);

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;
  if (!status) return null;

  return (
    <div className="graduation-page animate-fade-in">
      <div className="page-header">
        <div className="page-title"><GraduationCap size={24} /><h1>ตรวจสอบการจบการศึกษา</h1></div>
      </div>

      <div className={`graduation-status card ${status.eligible ? 'eligible' : 'not-eligible'}`}>
        <div className="status-icon">
          {status.eligible ? <CheckCircle size={64} /> : <XCircle size={64} />}
        </div>
        <h2>{status.eligible ? 'ผ่านเกณฑ์การจบการศึกษา' : 'ยังไม่ผ่านเกณฑ์การจบการศึกษา'}</h2>
        <p>{status.eligible ? 'คุณผ่านเกณฑ์ทุกข้อแล้ว สามารถยื่นขอจบการศึกษาได้' : 'ยังมีข้อกำหนดที่ต้องปฏิบัติตาม'}</p>
      </div>

      <div className="graduation-details">
        <div className="detail-card card">
          <h4>สรุปผลการเรียน</h4>
          <div className="detail-rows">
            <div className="detail-row">
              <span>หน่วยกิตที่ผ่าน</span>
              <span className={status.totalCredits >= status.requiredCredits ? 'text-success' : 'text-danger'}>
                {status.totalCredits} / {status.requiredCredits}
              </span>
            </div>
            <div className="detail-row">
              <span>GPAX</span>
              <span className={status.gpax >= status.minGpax ? 'text-success' : 'text-danger'}>
                {status.gpax.toFixed(2)} (ขั้นต่ำ {status.minGpax.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {status.missingRequirements.length > 0 && (
          <div className="detail-card card missing-card">
            <h4>ข้อกำหนดที่ยังไม่ผ่าน</h4>
            <ul>
              {status.missingRequirements.map((req, i) => (
                <li key={i}><XCircle size={14} /> {req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
