import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import EnrollmentPage from './pages/student/Enrollment';
import Transcript from './pages/student/Transcript';
import StudyPlan from './pages/student/StudyPlan';
import ProfessorDashboard from './pages/professor/Dashboard';
import SectionGrading from './pages/professor/Grading';
import AdminDashboard from './pages/admin/Dashboard';
import { useAuthStore } from './stores/auth.store';

/**
 * Higher-order component to redirect users to their specific dashboard
 * based on their role after logging in.
 */
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
  return (
    <BrowserRouter>
      {/* Notifications toast system */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Area (requires login) */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Main Dashboard Resolver */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          
          {/* Student Area */}
          <Route path="/student">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="enrollment" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <EnrollmentPage />
              </ProtectedRoute>
            } />
            <Route path="transcript" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Transcript />
              </ProtectedRoute>
            } />
            <Route path="curriculum/plan" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudyPlan />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Professor Area */}
          <Route path="/professor">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['PROFESSOR']}>
                <ProfessorDashboard />
              </ProtectedRoute>
            } />
            <Route path="section/:id/grading" element={
              <ProtectedRoute allowedRoles={['PROFESSOR']}>
                <SectionGrading />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Admin Area */}
          <Route path="/admin">
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Global Fallback for missing routes inside layout */}
          <Route path="*" element={<div style={{ padding: '2rem' }}>404 - Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
