import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiCheckCircle, FiXCircle,
  FiDollarSign, FiActivity, FiClock, FiUserPlus,
} from 'react-icons/fi';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Status badge helper
const StatusBadge = ({ status }) => {
  const map = {
    pending:     'badge-pending',
    confirmed:   'badge-confirmed',
    'in-progress':'badge-inprogress',
    completed:   'badge-completed',
    cancelled:   'badge-cancelled',
  };
  return <span className={map[status] ?? 'badge'}>{status}</span>;
};

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [recent, setRecent]       = useState([]);
  const [loadingStats, setLS]     = useState(true);
  const [loadingRecent, setLR]    = useState(true);
  const [resourceInsights, setResourceInsights] = useState(null);

  useEffect(() => {
    api.get('/admin/resource-insights')
      .then(({ data }) => setResourceInsights(data.data))
      .catch(() => toast.error('Failed to load resource insights'));
  }, []);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLS(false));
    api.get('/appointments')
      .then(({ data }) =>
        setRecent(
          [...(data.data || [])]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 8)
        )
      )
      .catch(() => toast.error('Failed to load recent appointments'))
      .finally(() => setLR(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Dashboard</h2>
          <p className="page-sub">Overview of system activity and statistics</p>
        </div>
        <Link to="/admin/doctors" className="btn-primary">
          <FiUserPlus className="w-4 h-4" />
          Add Doctor
        </Link>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      {loadingStats ? (
        <LoadingSpinner text="Loading statistics…" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients ?? 0}
            icon={FiUsers}
            iconBg="bg-blue-50 text-blue-600"
            subtitle="Registered patients"
          />
          <StatCard
            title="Total Doctors"
            value={stats?.totalDoctors ?? 0}
            icon={FiActivity}
            iconBg="bg-violet-50 text-violet-600"
            subtitle="Active staff"
          />
          <StatCard
            title="Today's Appointments"
            value={stats?.todayAppointments ?? 0}
            icon={FiCalendar}
            iconBg="bg-amber-50 text-amber-500"
            subtitle="Scheduled for today"
          />
          <StatCard
            title="Total Revenue"
            value={`Rs.${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            icon={FiDollarSign}
            iconBg="bg-emerald-50 text-emerald-600"
            subtitle="From completed appointments"
          />
        </div>
      )}

      {/* ── Secondary stats ───────────────────────────────────────────────── */}
      {!loadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="All Appointments"
            value={stats?.totalAppointments ?? 0}
            icon={FiCalendar}
            iconBg="bg-slate-100 text-slate-600"
          />
          <StatCard
            title="Pending"
            value={stats?.pendingAppointments ?? 0}
            icon={FiClock}
            iconBg="bg-amber-50 text-amber-600"
          />
          <StatCard
            title="Completed"
            value={stats?.completedAppointments ?? 0}
            icon={FiCheckCircle}
            iconBg="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Cancelled"
            value={stats?.cancelledAppointments ?? 0}
            icon={FiXCircle}
            iconBg="bg-red-50 text-red-500"
          />
        </div>
      )}

      {/* Resource optimization insights */}
      <div className="card p-6 space-y-5">
        <div>
          <h3 className="section-title mb-1">Resource Optimization Insights</h3>
          <p className="text-xs text-slate-400">
            Today's doctor workload. Planning capacity assumption: {resourceInsights?.capacityAssumptionPerDoctor ?? 20} appointments per doctor/day.
          </p>
        </div>
        {!resourceInsights ? (
          <p className="text-sm text-slate-400">Loading resource insights…</p>
        ) : (
          <>
            <div className="space-y-4">
              {resourceInsights.workload.map((doctor) => (
                <div key={doctor.doctorId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{doctor.doctorName} · {doctor.specialization}</span>
                    <span className="text-slate-500">{doctor.totalAppointments}/{doctor.capacity} ({doctor.utilizationPercent}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${doctor.utilizationPercent}%` }} />
                  </div>
                </div>
              ))}
              {resourceInsights.workload.length === 0 && <p className="text-sm text-slate-400">No available doctors found.</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Department Demand</h4>
                {resourceInsights.departmentDemand.map((item) => (
                  <div key={item.specialization} className="flex justify-between text-sm py-1">
                    <span>{item.specialization}</span><strong>{item.appointments}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {resourceInsights.recommendations.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Recent appointments table ─────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="section-title mb-0">Recent Appointments</h3>
          <Link to="/admin/appointments" className="text-sm text-blue-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {loadingRecent ? (
          <LoadingSpinner text="Loading appointments…" />
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FiCalendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No appointments yet</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Token</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="font-medium text-slate-800">{a.patient?.name}</div>
                      <div className="text-xs text-slate-400">{a.patient?.email}</div>
                    </td>
                    <td>
                      <div className="font-medium">{a.doctor?.name}</div>
                      <div className="text-xs text-slate-400">{a.doctor?.specialization}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      {a.date ? format(new Date(a.date), 'MMM d, yyyy') : '—'}
                    </td>
                    <td>
                      <span className="font-bold text-blue-600">#{a.tokenNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ${a.type === 'online'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
