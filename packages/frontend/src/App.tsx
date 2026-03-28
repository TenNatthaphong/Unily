import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuthStore } from './stores/auth.store';

// Pages
import Login from './pages/Login';
// Student
import StudentDashboard from './pages/student/Dashboard';
import EnrollmentPage from './pages/student/Enrollment';
import StudentSchedule from './pages/student/Schedule';
import StudentRecords from './pages/student/Records';
import Transcript from './pages/student/Transcript';
import StudyPlan from './pages/student/StudyPlan';
// Professor
import ProfessorDashboard from './pages/professor/Dashboard';
import ProfessorSchedule from './pages/professor/Schedule';
import ProfessorSections from './pages/professor/Sections';
import SectionGrading from './pages/professor/Grading';
import SectionDetail from './pages/professor/SectionDetail';
// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminFaculties from './pages/admin/Faculties';
import AdminCourses from './pages/admin/Courses';
import AdminCurriculums from './pages/admin/Curriculums';
import CurriculumFlowPage from './pages/admin/CurriculumFlow';
import AdminSections from './pages/admin/Sections';
import AdminUsers from './pages/admin/Users';
import AuditLogPage from './pages/admin/AuditLog';
import AdminSemesterConfig from './pages/admin/SemesterConfig';

import { useEffect, useRef } from 'react';

function DashboardRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'STUDENT': return <Navigate to="/student/dashboard" replace />;
    case 'PROFESSOR': return <Navigate to="/professor/dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  const { isAuthenticated, logout } = useAuthStore();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, logout]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected Area */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ── Student ─────────────────────────────────────── */}
          <Route path="/student">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="enrollment" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><EnrollmentPage /></ProtectedRoute>
            } />
            <Route path="schedule" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><StudentSchedule /></ProtectedRoute>
            } />
            <Route path="records" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><StudentRecords /></ProtectedRoute>
            } />
            <Route path="transcript" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><Transcript /></ProtectedRoute>
            } />
            <Route path="graduation" element={<Navigate to="/student/curriculum/plan" replace />} />
            <Route path="curriculum/plan" element={
              <ProtectedRoute allowedRoles={['STUDENT']}><StudyPlan /></ProtectedRoute>
            } />
          </Route>

          {/* ── Professor ────────────────────────────────────── */}
          <Route path="/professor">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['PROFESSOR']}><ProfessorDashboard /></ProtectedRoute>
            } />
            <Route path="schedule" element={<Navigate to="/professor/dashboard" replace />} />
            <Route path="sections" element={<Navigate to="/professor/dashboard" replace />} />
            <Route path="section/:id" element={
              <ProtectedRoute allowedRoles={['PROFESSOR']}><SectionDetail /></ProtectedRoute>
            } />
            <Route path="section/:id/grading" element={<Navigate to="/professor/sections" replace />} />
          </Route>

          {/* ── Admin ────────────────────────────────────────── */}
          <Route path="/admin">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="org/faculties" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminFaculties /></ProtectedRoute>
            } />
            <Route path="courses" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminCourses /></ProtectedRoute>
            } />
            <Route path="curriculums" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminCurriculums /></ProtectedRoute>
            } />
            <Route path="curriculums/:id/flow" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><CurriculumFlowPage /></ProtectedRoute>
            } />
            <Route path="sections" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminSections /></ProtectedRoute>
            } />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>
            } />
            <Route path="audit-log" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AuditLogPage /></ProtectedRoute>
            } />
            <Route path="settings/semester" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminSemesterConfig /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}>404 - Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
