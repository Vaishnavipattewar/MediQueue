import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCalendar, FiClock, FiFileText, FiVideo } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
  '04:00 PM - 04:30 PM',
  '04:30 PM - 05:00 PM',
];

const todayISO = () => new Date().toISOString().split('T')[0];

export default function BookAppointment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedDoctorId = params.get('doctor');

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null); // add at top
  const [form, setForm] = useState({
    doctorId: '',
    date: todayISO(),
    timeSlot: TIME_SLOTS[0],
    type: 'offline',
    notes: '',
  });
  const handlePayment = async () => {
    if (!appointmentId) return;
    if (!window.Razorpay) {
      toast.error('Razorpay checkout could not be loaded. Refresh and try again.');
      return;
    }
    try {
      const { data: orderResponse } = await api.post(`/appointments/${appointmentId}/payment/order`);
      const order = orderResponse.data;
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'MediQueue',
        description: `Appointment with ${selectedDoctor?.name || 'doctor'}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post(`/appointments/${appointmentId}/payment/verify`, response);
            toast.success('Payment verified successfully!');
            navigate(`/patient/queue/${appointmentId}`);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {},
        theme: { color: '#2563eb' },
      };
      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', () => toast.error('Payment failed. You can retry from this page.'));
      checkout.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start payment. Check server Razorpay settings.');
    }
  };

  useEffect(() => {
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const { data } = await api.get('/doctors');
        const list = data.data || [];
        setDoctors(list);

        const initialDoctorId = preselectedDoctorId && list.some((d) => d._id === preselectedDoctorId)
          ? preselectedDoctorId
          : list[0]?._id || '';
        setForm((prev) => ({ ...prev, doctorId: initialDoctorId }));
      } catch {
        toast.error('Failed to load doctors');
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [preselectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === form.doctorId) || null,
    [doctors, form.doctorId]
  );

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

 const submit = async (e) => {
  e.preventDefault();

  setSubmitting(true);
  try {
    const { data } = await api.post('/appointments', form);

    setAppointmentId(data.data._id); // ✅ STORE ID

    toast.success(`Appointment booked! Token #${data.data.tokenNumber}`);

    // ❌ REMOVE this line for now
    // navigate(`/patient/queue/${data.data._id}`);

  } catch (err) {
    toast.error('Failed to book appointment');
  } finally {
    setSubmitting(false);
  }
};

  if (loadingDoctors) return <LoadingSpinner text="Loading doctors…" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Book Appointment</h2>
          <p className="page-sub">Choose doctor, date, slot and consultation type</p>
        </div>
        <Link to="/patient/doctors" className="btn-outline">
          Browse Doctors
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Doctor *</label>
              <select
                name="doctorId"
                value={form.doctorId}
                onChange={setField}
                className="input"
                required
              >
                {doctors.length === 0 && <option value="">No doctors available</option>}
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} — {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Appointment Date *</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="date"
                    min={todayISO()}
                    value={form.date}
                    onChange={setField}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Time Slot *</label>
                <div className="relative">
                  <FiClock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    name="timeSlot"
                    value={form.timeSlot}
                    onChange={setField}
                    className="input pl-10"
                    required
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Consultation Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: 'offline' }))}
                  className={`btn-md rounded-xl border ${form.type === 'offline'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  🏥 In-person
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: 'online' }))}
                  className={`btn-md rounded-xl border ${form.type === 'online'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <FiVideo className="w-4 h-4" /> Online
                </button>
              </div>
            </div>

            <div>
              <label className="label">Symptoms / Notes</label>
              <div className="relative">
                <FiFileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={setField}
                  rows={4}
                  className="input pl-10 resize-none"
                  placeholder="Describe symptoms or reason for visit"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || doctors.length === 0}
              className="btn-primary w-full"
            >
              {submitting ? <LoadingSpinner size="sm" text="" /> : 'Confirm Appointment'}
            </button>
       <button
  type="button"
  onClick={handlePayment}
  disabled={!appointmentId}
  className="btn-primary"
>
  Pay Consultation Fee
</button>
          </form>
        </div>

        <div className="card p-6 h-fit">
          <h3 className="section-title mb-3">Booking Summary</h3>
          {!selectedDoctor ? (
            <p className="text-sm text-slate-400">Select a doctor to see details.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Doctor</p>
                <p className="font-semibold text-slate-800">{selectedDoctor.name}</p>
                <p className="text-slate-500 text-xs">{selectedDoctor.specialization}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">Date</p>
                  <p className="font-semibold text-slate-700">{form.date}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">Time</p>
                  <p className="font-semibold text-slate-700">{form.timeSlot}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs">Consultation Type</p>
                <p className="font-semibold text-slate-700 capitalize">{form.type}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-blue-500 text-xs">Consultation Fee</p>
                <p className="font-bold text-blue-700">Rs.{selectedDoctor.fee}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
