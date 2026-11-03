import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiClock, FiCheckCircle, FiXCircle,
  FiPlusCircle, FiSearch, FiArrowRight,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, isToday, isFuture } from 'date-fns';


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

export default function PatientDashboard() {
  const { user }                            = useAuth();
  const [appointments, setAppointments]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [cancelling, setCancelling]         = useState(null);
  const [queueSnapshot, setQueueSnapshot]   = useState(null);
  const [queueLoading, setQueueLoading]     = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    api.get('/appointments')
      .then(({ data }) => setAppointments(data.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a))
      );
      toast.success('Appointment cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  // Derived stats
  const total     = appointments.length;
  const pending   = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

  // Upcoming (today + future, non-cancelled)
  const upcoming = appointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
    .filter((a) => isToday(new Date(a.date)) || isFuture(new Date(a.date)))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Past (completed or past pending)
  const past = appointments
    .filter((a) => a.status === 'completed' || a.status === 'cancelled')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  useEffect(() => {
    const nextActive = appointments
      .filter((a) => ['pending', 'confirmed', 'in-progress'].includes(a.status))
      .filter((a) => isToday(new Date(a.date)) || isFuture(new Date(a.date)))
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    if (!nextActive?.doctor?._id) {
      setQueueSnapshot(null);
      setQueueLoading(false);
      return;
    }

    const loadQueueSnapshot = async () => {
      setQueueLoading(true);
      try {
        const date = format(new Date(nextActive.date), 'yyyy-MM-dd');
        const { data } = await api.get(`/appointments/queue/${nextActive.doctor._id}`, {
          params: { date },
        });

        const activeQueue = (data.data.queue || []).filter((q) =>
          ['pending', 'confirmed', 'in-progress'].includes(q.status)
        );
        const idx = activeQueue.findIndex((q) => q._id === nextActive._id);
        const peopleAhead = idx >= 0 ? idx : 0;
        const avgWait = data.data.avgWaitMinutes ?? 15;

        setQueueSnapshot({
          appointmentId: nextActive._id,
          tokenNumber: nextActive.tokenNumber,
          doctorName: nextActive.doctor?.name,
          currentToken: data.data.currentToken,
          position: idx >= 0 ? idx + 1 : null,
          peopleAhead,
          estimatedWaitMinutes: peopleAhead * avgWait,
        });
      } catch {
        setQueueSnapshot(null);
      } finally {
        setQueueLoading(false);
      }
    };

    loadQueueSnapshot();
  }, [appointments]);

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Welcome header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-10 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-blue-200 text-sm mb-1">Hello,</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{user?.name} 👋</h2>
          <p className="text-blue-100 text-sm mb-6">
            {pending > 0
              ? `You have ${pending} upcoming appointment${pending > 1 ? 's' : ''}.`
              : 'No upcoming appointments. Book one today!'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/patient/book" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition shadow-sm">
              <FiPlusCircle className="w-4 h-4" /> Book Appointment
            </Link>
            <Link to="/patient/doctors" className="inline-flex items-center gap-2 bg-blue-500/40 text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-blue-500/60 transition">
              <FiSearch className="w-4 h-4" /> Find Doctors
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Visits"      value={total}     icon={FiCalendar}     iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="Upcoming"          value={pending}   icon={FiClock}        iconBg="bg-amber-50 text-amber-500" />
        <StatCard title="Completed"         value={completed} icon={FiCheckCircle}  iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard title="Cancelled"         value={cancelled} icon={FiXCircle}      iconBg="bg-red-50 text-red-500" />
      </div>

      {/* Queue position snapshot */}
      {(queueLoading || queueSnapshot) && (
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="section-title mb-0">Current Queue Position</h3>
            {queueSnapshot?.appointmentId && (
              <Link to={`/patient/queue/${queueSnapshot.appointmentId}`} className="btn-outline btn-sm">
                <FiClock className="w-3.5 h-3.5" /> Open Live Queue
              </Link>
            )}
          </div>
          {queueLoading ? (
            <p className="text-sm text-slate-400">Loading queue details…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs">Doctor</p>
                <p className="font-semibold text-slate-700">{queueSnapshot?.doctorName}</p>
                <p className="text-xs text-slate-500">Token #{queueSnapshot?.tokenNumber}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs">Serving / Position</p>
                <p className="font-semibold text-slate-700">
                  {queueSnapshot?.currentToken ? `#${queueSnapshot.currentToken}` : 'Not started'}{' '}
                  {queueSnapshot?.position ? `· #${queueSnapshot.position}` : ''}
                </p>
                <p className="text-xs text-slate-500">{queueSnapshot?.peopleAhead ?? 0} ahead of you</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-blue-500 text-xs">Estimated Wait</p>
                <p className="font-semibold text-blue-700">~{queueSnapshot?.estimatedWaitMinutes ?? 0} min</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming appointments */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="section-title mb-0">Upcoming Appointments</h3>
          <Link to="/patient/book" className="btn-primary btn-sm">
            <FiPlusCircle className="w-3.5 h-3.5" /> Book New
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading appointments…" />
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <FiCalendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium mb-1">No upcoming appointments</p>
            <Link to="/patient/book" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
              Book your first appointment <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map((a) => (
              <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition">
                <div className="flex items-start gap-4">
                  {/* Token badge */}
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-lg">#{a.tokenNumber}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{a.doctor?.name}</p>
                    <p className="text-xs text-slate-400">{a.doctor?.specialization}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <FiCalendar className="w-3 h-3" />
                        {isToday(new Date(a.date)) ? 'Today' : format(new Date(a.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{a.timeSlot}</span>
                      <span className={`badge ${a.type === 'online'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-100 text-slate-500'}`}>
                        {a.type === 'online' ? '🎥 Online' : '🏥 In-person'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-16 sm:ml-0">
                  <StatusBadge status={a.status} />
                  {/* View queue */}
                  {(a.status === 'pending' || a.status === 'confirmed' || a.status === 'in-progress') && (
                    <Link
                      to={`/patient/queue/${a._id}`}
                      className="btn-outline btn-sm text-xs"
                    >
                      <FiClock className="w-3 h-3" /> Queue
                    </Link>
                  )}
                  {/* Online join */}
                  {a.type === 'online' && a.doctor?.meetingLink && (
                    <a
                      href={a.doctor.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-success btn-sm text-xs"
                    >
                      🎥 Join Meeting 
                    </a>
                  )}
                  {/* Cancel */}
                  {['pending', 'confirmed'].includes(a.status) && (
                    <button
                      onClick={() => cancelAppointment(a._id)}
                      disabled={cancelling === a._id}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {cancelling === a._id ? '…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past appointments */}
      {!loading && past.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-title mb-0">Recent History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {past.map((a) => (
              <div key={a._id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-500 font-bold text-sm">#{a.tokenNumber}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.doctor?.name}</p>
                    <p className="text-xs text-slate-400">{format(new Date(a.date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
               <div className="flex items-center gap-3">
  <StatusBadge status={a.status} />
  {a.paymentStatus === "paid" && (
  <span className="ml-2 text-xs text-green-600 font-semibold">
    💰 Paid
  </span>
)}
{a.paymentStatus === "pending" && (
  <span className="ml-2 text-xs text-red-500">
    Unpaid
  </span>
)}

  {a.prescription && (
    <button
      onClick={() => setSelectedPrescription(a.prescription)}
      className="text-xs text-blue-600 hover:underline"
    >
      View Prescription
    </button>
  )}
</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedPrescription && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    
    <div className="bg-white rounded-lg p-5 w-[350px] shadow-lg relative">
      
      <h3 className="text-lg font-semibold mb-2">
        Prescription
      </h3>

      <p className="text-sm text-gray-600">
        {selectedPrescription}
      </p>

      <button
        onClick={() => setSelectedPrescription(null)}
        className="absolute top-2 right-3 text-gray-500 hover:text-black"
      >
        ✖
      </button>

    </div>

  </div>
)}
    </div>
  );
}
