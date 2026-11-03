import { useEffect, useState, useCallback } from 'react';
import {
  FiPlay, FiCheckCircle, FiClock, FiUsers,
  FiRefreshCw, FiX, FiFileText,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Status badge
const StatusBadge = ({ status }) => {
  const map = {
    pending:      'badge-pending',
    confirmed:    'badge-confirmed',
    'in-progress':'badge-inprogress',
    completed:    'badge-completed',
    cancelled:    'badge-cancelled',
  };
  return <span className={map[status] ?? 'badge'}>{status}</span>;
};

// Prescription modal
function PrescriptionModal({ appointment, onClose, onSaved }) {
  const [text, setText]   = useState(appointment.prescription || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/appointments/${appointment._id}`, {
        status: 'completed',
        prescription: text,
      });
      toast.success('Appointment completed & prescription saved!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Add Prescription & Complete</h3>
            <p className="text-xs text-slate-400 mt-0.5">Patient: {appointment.patient?.name} | Token #{appointment.tokenNumber}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Prescription / Notes</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Enter prescription, medications, follow-up instructions…"
              className="input resize-none"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
            <p><strong>Symptoms:</strong> {appointment.notes || 'Not specified'}</p>
            <p><strong>Type:</strong> {appointment.type === 'online' ? '🎥 Online' : '🏥 In-person'}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-success flex-1">
            {saving ? <LoadingSpinner size="sm" text="" /> : '✓ Complete Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page
export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(null); // id of appointment being updated
  const [prescModal, setPrescModal]     = useState(null); // appointment obj

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch doctor profile & today's appointments in parallel
      const [profRes, apptRes] = await Promise.all([
        api.get('/doctors/my-profile'),
        api.get('/appointments?today=true'),
      ]);
      setDoctorProfile(profRes.data.data);
      setAppointments(apptRes.data.data);
    } catch (err) {
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(`Marked as ${status}`);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  // Derived stats
  const pending     = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
  const inProgress  = appointments.filter((a) => a.status === 'in-progress').length;
  const completed   = appointments.filter((a) => a.status === 'completed').length;
  const currentToken = appointments.find((a) => a.status === 'in-progress')?.tokenNumber ?? null;

  if (loading) return <LoadingSpinner text="Loading queue…" />;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {doctorProfile ? `Dr. ${doctorProfile.name.replace(/^Dr\.?\s*/i, '')}` : "Today's Queue"}
          </h2>
          <p className="page-sub">
            {doctorProfile?.specialization} ·{' '}
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button onClick={fetchData} className="btn-outline">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Current serving banner */}
      {currentToken && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Currently Serving</p>
            <p className="text-4xl font-black tracking-wider">Token #{currentToken}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <FiPlay className="w-7 h-7 text-white" />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Waiting"
          value={pending}
          icon={FiClock}
          iconBg="bg-amber-50 text-amber-500"
          subtitle="In queue"
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={FiPlay}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Completed Today"
          value={completed}
          icon={FiCheckCircle}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Queue table */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="section-title mb-0">
            <FiUsers className="inline w-4 h-4 mr-2 text-blue-600" />
            Today&apos;s Patients
          </h3>
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
            {appointments.length} total
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FiUsers className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No appointments today</p>
            <p className="text-xs mt-1">Queue is empty — enjoy your day!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id} className={a.status === 'in-progress' ? 'bg-blue-50/40' : ''}>
                    <td>
                      <span className="text-2xl font-black text-blue-600">#{a.tokenNumber}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{a.patient?.name}</div>
                      <div className="text-xs text-slate-400">{a.patient?.age ? `Age ${a.patient.age}` : ''} {a.patient?.gender ?? ''}</div>
                    </td>
                    <td className="whitespace-nowrap text-sm">{a.timeSlot}</td>
                    <td>
                      <span className={`badge ${a.type === 'online'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-100 text-slate-500'}`}>
                        {a.type === 'online' ? '🎥 Online' : '🏥 In-person'}
                      </span>
                    </td>
                    <td className="max-w-[150px]">
                      <p className="text-xs text-slate-500 truncate">{a.notes || '—'}</p>
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* Start consultation */}
                        {(a.status === 'pending' || a.status === 'confirmed') && (
  <>
    {a.type === "online" && a.paymentStatus !== "paid" ? (
      <span className="text-red-500 text-xs font-medium">
        Payment Pending
      </span>
    ) : (
      <button
        onClick={() => updateStatus(a._id, 'in-progress')}
        disabled={updating === a._id}
        className="btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl px-3 py-1.5 inline-flex items-center gap-1 transition"
      >
        {updating === a._id
          ? <LoadingSpinner size="sm" text="" />
          : <><FiPlay className="w-3 h-3" /> Start</>
        }
      </button>
    )}
  </>
)}

                        {/* Complete (with prescription) */}
                        {a.status === 'in-progress' && (
                          <>
                            {a.type === 'online' && a.doctor?.meetingLink && (
                              <a
                                href={a.doctor.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl px-3 py-1.5 inline-flex items-center gap-1 transition text-xs font-medium"
                              >
                                🎥 Join
                              </a>
                            )}
                            <button
                              onClick={() => setPrescModal(a)}
                              className="btn-sm bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-xl px-3 py-1.5 inline-flex items-center gap-1 transition text-xs font-medium"
                              title="Add prescription & complete"
                            >
                              <FiFileText className="w-3 h-3" /> Complete
                            </button>
                          </>
                        )}

                        {/* Quick complete without prescription */}
                        {a.status === 'in-progress' && (
                          <button
                            onClick={() => updateStatus(a._id, 'completed')}
                            disabled={updating === a._id}
                            className="btn-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl px-3 py-1.5 inline-flex items-center gap-1 transition text-xs font-medium"
                            title="Mark done"
                          >
                            <FiCheckCircle className="w-3 h-3" />
                          </button>
                        )}

                        {a.status === 'completed' && (
                          <button
                            onClick={() => setPrescModal(a)}
                            className="btn-sm text-slate-400 hover:bg-slate-100 rounded-xl px-2 py-1.5 inline-flex items-center gap-1 transition"
                            title="View/edit notes"
                          >
                            <FiFileText className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription modal */}
      {prescModal && (
        <PrescriptionModal
          appointment={prescModal}
          onClose={() => setPrescModal(null)}
          onSaved={() => { setPrescModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
