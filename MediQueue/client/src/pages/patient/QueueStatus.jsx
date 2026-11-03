import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiActivity, FiClock, FiRefreshCw, FiUsers, FiCheckCircle, FiCalendar,
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'in-progress'];

const StatusBadge = ({ status }) => {
  const map = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    'in-progress': 'badge-inprogress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  return <span className={map[status] ?? 'badge'}>{status}</span>;
};

export default function QueueStatus() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiEstimate, setAiEstimate] = useState(null);

  const fetchQueue = useCallback(async (silent = false) => {
    if (!id) return;

    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: appointmentRes } = await api.get(`/appointments/${id}`);
      const appointmentData = appointmentRes.data;
      setAppointment(appointmentData);

      const date = format(new Date(appointmentData.date), 'yyyy-MM-dd');
      const { data: queueRes } = await api.get(`/appointments/queue/${appointmentData.doctor._id}`, {
        params: { date },
      });

      setQueueData(queueRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch queue status');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  const queue = queueData?.queue || [];

  const activeQueue = useMemo(
    () => queue.filter((item) => ACTIVE_STATUSES.includes(item.status)),
    [queue]
  );

  const position = useMemo(() => {
    if (!appointment || !ACTIVE_STATUSES.includes(appointment.status)) return null;
    const idx = activeQueue.findIndex((item) => item._id === appointment._id);
    return idx >= 0 ? idx + 1 : null;
  }, [activeQueue, appointment]);

  const peopleAhead = position ? position - 1 : 0;
  const avgWait = queueData?.avgWaitMinutes ?? 15;
  const estimatedWaitMinutes = peopleAhead * avgWait;

  useEffect(() => {
    if (!appointment || !queueData || !ACTIVE_STATUSES.includes(appointment.status)) return;
    fetch('http://127.0.0.1:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peopleAhead,
        activeQueue: activeQueue.length,
        completedToday: queueData.completedCount || 0,
      }),
    })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('AI service unavailable')))
      .then(setAiEstimate)
      .catch(() => setAiEstimate(null));
  }, [appointment, queueData, activeQueue.length, peopleAhead]);

  if (loading) return <LoadingSpinner text="Loading queue status…" />;

  if (!appointment) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500">Appointment not found.</p>
        <Link to="/patient/dashboard" className="btn-primary mt-4">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Queue Status</h2>
          <p className="page-sub">
            {appointment.doctor?.name} · {format(new Date(appointment.date), 'EEEE, MMM d, yyyy')}
          </p>
        </div>
        <button onClick={() => fetchQueue(true)} className="btn-outline" disabled={refreshing}>
          <FiRefreshCw className="w-4 h-4" /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white p-6 shadow-lg">
        <p className="text-blue-100 text-sm mb-1">Your Token</p>
        <p className="text-4xl font-black tracking-wider mb-3">#{appointment.tokenNumber}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={appointment.status} />
          <span className="text-blue-100">•</span>
          <span>{appointment.type === 'online' ? 'Online consultation' : 'In-person consultation'}</span>
        </div>
      </div>

      {ACTIVE_STATUSES.includes(appointment.status) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs text-slate-400 mb-1">Current Token</p>
            <p className="text-2xl font-bold text-blue-700">
              {queueData?.currentToken ? `#${queueData.currentToken}` : 'Not started'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-400 mb-1">People Ahead</p>
            <p className="text-2xl font-bold text-slate-800">{peopleAhead}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-slate-400 mb-1">Estimated Wait</p>
            <p className="text-2xl font-bold text-slate-800">~{aiEstimate?.estimatedWaitMinutes ?? estimatedWaitMinutes} min</p>
            <p className="text-xs text-slate-400 mt-1">{aiEstimate ? 'Random Forest prototype' : 'Basic queue estimate (AI service offline)'}</p>
          </div>
        </div>
      ) : (
        <div className="card p-6 flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-semibold text-slate-800 capitalize">Appointment {appointment.status}</p>
            <p className="text-sm text-slate-500 mt-1">
              This appointment is no longer in the active queue.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="section-title mb-0">
            <FiUsers className="inline w-4 h-4 mr-2 text-blue-600" />
            Live Queue Snapshot
          </h3>
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
            {activeQueue.length} waiting / active
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No queue data for this day.</div>
        ) : (
          <div className="table-wrap rounded-none border-0">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Queue Position</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const isMine = item._id === appointment._id;
                  const queueIndex = activeQueue.findIndex((q) => q._id === item._id);
                  return (
                    <tr key={item._id} className={isMine ? 'bg-blue-50/50' : ''}>
                      <td className="font-black text-blue-700">#{item.tokenNumber}</td>
                      <td>
                        {item.patient?.name}
                        {isMine && (
                          <span className="ml-2 badge bg-blue-50 text-blue-700 border border-blue-200">You</span>
                        )}
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="text-sm text-slate-600">
                        {queueIndex >= 0 ? queueIndex + 1 : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <FiClock className="w-4 h-4" />
          <span>Basic average time per patient: ~{avgWait} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm mt-2">
          <FiCalendar className="w-4 h-4" />
          <span>Slot: {appointment.timeSlot}</span>
        </div>
        {appointment.type === 'online' && appointment.doctor?.meetingLink && appointment.status === 'in-progress' && (
          <a
            href={appointment.doctor.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="btn-success mt-4"
          >
            <FiActivity className="w-4 h-4" /> Join Consultation
          </a>
        )}
      </div>
    </div>
  );
}
