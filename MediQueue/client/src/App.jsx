import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// ── Auth Pages
import Login    from './pages/Login';
import Register from './pages/Register';

// ── Admin Pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageDoctors     from './pages/admin/ManageDoctors';
import AdminAppointments from './pages/admin/AdminAppointments';

// ── Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// ── Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorList       from './pages/patient/DoctorList';
import BookAppointment  from './pages/patient/BookAppointment';
import QueueStatus      from './pages/patient/QueueStatus';

/**
 * Redirect "/" to the correct dashboard based on logged-in role.
 */
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')  return <Navigate to="/admin/dashboard"   replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard"  replace />;
  return <Navigate to="/patient/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '12px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* ── Public ─────────────────────────────────────────────────── */}
          <Route path="/"         element={<RoleRedirect />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Admin ──────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard"    element={<AdminDashboard />} />
              <Route path="/admin/doctors"      element={<ManageDoctors />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
            </Route>
          </Route>

          {/* ── Doctor ─────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['doctor']} />}>
            <Route element={<Layout />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Route>
          </Route>

          {/* ── Patient ────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['patient']} />}>
            <Route element={<Layout />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/doctors"   element={<DoctorList />} />
              <Route path="/patient/book"      element={<BookAppointment />} />
              <Route path="/patient/queue/:id" element={<QueueStatus />} />
            </Route>
          </Route>

          {/* ── Fallback ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
