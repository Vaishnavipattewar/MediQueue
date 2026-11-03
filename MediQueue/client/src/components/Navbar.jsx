import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/admin/dashboard':    'Admin Dashboard',
  '/admin/doctors':      'Manage Doctors',
  '/admin/appointments': 'All Appointments',
  '/doctor/dashboard':   "Today's Queue",
  '/patient/dashboard':  'My Dashboard',
  '/patient/doctors':    'Find a Doctor',
  '/patient/book':       'Book Appointment',
};

const Navbar = ({ onMenuClick }) => {
  const { user }     = useAuth();
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname] ??
    (pathname.startsWith('/patient/queue') ? 'Queue Status' : 'MediQueue');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-semibold text-slate-800 leading-none">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{today}</p>
        </div>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-1">
        {/* Notification bell (decorative) */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition" aria-label="Notifications">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-100 mx-2" />

        {/* User chip */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold select-none">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
