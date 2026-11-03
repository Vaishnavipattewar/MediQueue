import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCalendar, FiPlusCircle,
  FiSearch, FiActivity, FiLogOut, FiX,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// ── Role-specific nav items ────────────────────────────────────────────────────
const NAV = {
  admin: [
    { label: 'Dashboard',        to: '/admin/dashboard',    icon: FiHome },
    { label: 'Manage Doctors',   to: '/admin/doctors',      icon: FiUsers },
    { label: 'All Appointments', to: '/admin/appointments', icon: FiCalendar },
  ],
  doctor: [
    { label: "Today's Queue",    to: '/doctor/dashboard',   icon: FiActivity },
  ],
  patient: [
    { label: 'Dashboard',        to: '/patient/dashboard',  icon: FiHome },
    { label: 'Find Doctors',     to: '/patient/doctors',    icon: FiSearch },
    { label: 'Book Appointment', to: '/patient/book',       icon: FiPlusCircle },
  ],
};

// Role badge style
const ROLE_BADGE = {
  admin:   'bg-violet-100 text-violet-700 border border-violet-200',
  doctor:  'bg-blue-100   text-blue-700   border border-blue-200',
  patient: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();

  const navItems = NAV[user?.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-slate-100">

      {/* ── Branding ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-base select-none">+</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">MediQueue</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hospital System</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
            aria-label="Close menu"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Role badge ────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[user?.role]}`}>
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Portal
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── User profile + logout ──────────────────────────────────────────── */}
      <div className="border-t border-slate-100 p-4 flex-shrink-0">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-sm font-bold select-none">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
                     text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100
                     transition-all duration-150"
        >
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
