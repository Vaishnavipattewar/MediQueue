import { useEffect, useState } from 'react';
import { FiCalendar, FiFilter, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

const StatusBadge = ({ status }) => {
  const map = {
    pending:      'badge-pending',
    confirmed:    'badge-confirmed',
    'in-progress':'badge-inprogress',
    completed:    'badge-completed',
    cancelled:    'badge-cancelled',
  };
  return <span className={map[status] ?? 'badge bg-slate-100 text-slate-600'}>{status}</span>;
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('');

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/appointments')
      .then(({ data }) => setAppointments(data.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAppointments, []);

  // Client-side filtering
  const filtered = appointments.filter((a) => {
    const statusOk = statusFilter === 'all' || a.status === statusFilter;
    const dateOk   = !dateFilter || format(new Date(a.date), 'yyyy-MM-dd') === dateFilter;
    return statusOk && dateOk;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">All Appointments</h2>
          <p className="page-sub">{appointments.length} total appointments</p>
        </div>
        <button onClick={fetchAppointments} className="btn-outline">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FiFilter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition capitalize ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="ml-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input text-sm py-1.5"
            />
          </div>
          {(statusFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => { setStatusFilter('all'); setDateFilter(''); }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="Loading appointments…" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FiCalendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No appointments match your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Token</th>
                  <th>Type</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr key={a._id}>
                    <td className="text-slate-400 text-xs">{idx + 1}</td>
                    <td>
                      <div className="font-medium text-slate-800">{a.patient?.name}</div>
                      <div className="text-xs text-slate-400">{a.patient?.phone}</div>
                    </td>
                    <td>
                      <div className="font-medium">{a.doctor?.name}</div>
                      <div className="text-xs text-slate-400">{a.doctor?.specialization}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div>{a.date ? format(new Date(a.date), 'MMM d, yyyy') : '—'}</div>
                      <div className="text-xs text-slate-400">{a.timeSlot}</div>
                    </td>
                    <td>
                      <span className="font-bold text-blue-600">#{a.tokenNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ${a.type === 'online'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-100 text-slate-500'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="font-semibold">${a.doctor?.fee ?? '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="max-w-xs">
                      <p className="text-xs text-slate-500 truncate">{a.notes || a.prescription || '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary footer */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {appointments.length} appointments
        </p>
      )}
    </div>
  );
}
