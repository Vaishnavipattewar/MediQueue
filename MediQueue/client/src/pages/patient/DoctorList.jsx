import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiRefreshCw, FiUser, FiClock, FiVideo, FiCalendar,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('all');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctors');
      setDoctors(data.data || []);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const specializations = useMemo(() => ([
    'all',
    ...new Set((doctors || []).map((d) => d.specialization).filter(Boolean)),
  ]), [doctors]);

  const filtered = useMemo(() => doctors.filter((doctor) => {
    const bySearch = !search
      || doctor.name.toLowerCase().includes(search.toLowerCase())
      || doctor.specialization.toLowerCase().includes(search.toLowerCase());
    const bySpecialization = specialization === 'all' || doctor.specialization === specialization;
    return bySearch && bySpecialization;
  }), [doctors, search, specialization]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Find Doctors</h2>
          <p className="page-sub">{doctors.length} available doctor{doctors.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchDoctors} className="btn-outline">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor or specialization…"
              className="input pl-10"
            />
          </div>

          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="input md:max-w-xs"
          >
            {specializations.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All specializations' : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading doctors…" />
      ) : filtered.length === 0 ? (
        <div className="card py-16 px-6 text-center">
          <p className="text-slate-400 text-sm">No doctors match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((doctor) => (
            <div key={doctor._id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{doctor.name}</p>
                    <p className="text-sm text-slate-500">{doctor.specialization}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{doctor.qualification}</p>
                  </div>
                </div>

                <span className={`badge ${doctor.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'}`}
                >
                  {doctor.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400">Consultation Fee</p>
                  <p className="font-semibold text-slate-700">Rs.{doctor.fee}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400">Experience</p>
                  <p className="font-semibold text-slate-700">{doctor.experience ?? 0} years</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                  <FiCalendar className="w-3 h-3 mr-1" /> Bookable
                </span>
                {doctor.meetingLink && (
                  <span className="badge bg-violet-50 text-violet-700 border border-violet-200">
                    <FiVideo className="w-3 h-3 mr-1" /> Online available
                  </span>
                )}
                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                  <FiClock className="w-3 h-3 mr-1" /> Queue token system
                </span>
              </div>

              <div className="mt-5">
                <Link to={`/patient/book?doctor=${doctor._id}`} className="btn-primary w-full">
                  <FiCalendar className="w-4 h-4" /> Book Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
