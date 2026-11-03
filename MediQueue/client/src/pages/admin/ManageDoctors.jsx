import { useEffect, useState } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiX, FiAlertCircle, FiUser,
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', specialization: '', qualification: 'MBBS',
  experience: '', fee: '', phone: '', email: '',
  meetingLink: '', isAvailable: true,
  createAccount: false, password: '',
};

// ── Modal ────────────────────────────────────────────────────────────────────
function DoctorModal({ doctor, onClose, onSaved }) {
  const isEdit = !!doctor;
  const [form, setForm]   = useState(isEdit ? { ...doctor, createAccount: false, password: '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await api.put(`/doctors/${doctor._id}`, form);
        toast.success('Doctor updated!');
      } else {
        await api.post('/doctors', form);
        toast.success('Doctor added!');
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">{isEdit ? 'Edit Doctor' : 'Add New Doctor'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form id="doctor-form" onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full name *</label>
                <input name="name" value={form.name} onChange={set} required className="input" placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <label className="label">Specialization *</label>
                <input name="specialization" value={form.specialization} onChange={set} required className="input" placeholder="Cardiology" />
              </div>
              <div>
                <label className="label">Qualification</label>
                <input name="qualification" value={form.qualification} onChange={set} className="input" placeholder="MBBS, MD" />
              </div>
              <div>
                <label className="label">Experience (years)</label>
                <input type="number" name="experience" value={form.experience} onChange={set} min={0} className="input" placeholder="5" />
              </div>
              <div>
                <label className="label">Consultation fee (Rs.) *</label>
                <input type="number" name="fee" value={form.fee} onChange={set} required min={0} className="input" placeholder="500" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" value={form.phone} onChange={set} className="input" placeholder="+1 555 0100" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" value={form.email} onChange={set} className="input" placeholder="doctor@hospital.com" />
              </div>
              <div className="col-span-2">
                <label className="label">Telemedicine meeting link</label>
                <input name="meetingLink" value={form.meetingLink} onChange={set} className="input" placeholder="https://meet.google.com/..." />
              </div>
            </div>

            {/* Availability toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAvail"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={set}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <label htmlFor="isAvail" className="text-sm font-medium text-slate-700 cursor-pointer">
                Doctor is currently available
              </label>
            </div>

            {/* Create login account (only when adding) */}
            {!isEdit && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="createAcc"
                    name="createAccount"
                    checked={form.createAccount}
                    onChange={set}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <label htmlFor="createAcc" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Create login account for this doctor
                  </label>
                </div>
                {form.createAccount && (
                  <div>
                    <label className="label">Login password *</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={set}
                      required={form.createAccount}
                      minLength={6}
                      className="input"
                      placeholder="Min 6 characters"
                    />
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            form="doctor-form"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? <LoadingSpinner size="sm" text="" /> : isEdit ? 'Save Changes' : 'Add Doctor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDelete({ doctor, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <FiTrash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Doctor?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Remove <strong>{doctor.name}</strong> permanently? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1">
            {loading ? <LoadingSpinner size="sm" text="" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManageDoctors() {
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);   // null | 'add' | doctor obj
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/doctors/all')
      .then(({ data }) => setDoctors(data.data))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchDoctors, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/doctors/${delTarget._id}`);
      toast.success('Doctor removed');
      setDelTarget(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Manage Doctors</h2>
          <p className="page-sub">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <FiPlus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization…"
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="Loading doctors…" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FiUser className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{search ? 'No results found.' : 'No doctors added yet.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 text-sm font-bold">
                            {d.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td>{d.specialization}</td>
                    <td>{d.experience ?? 0} yrs</td>
                    <td className="font-semibold">${d.fee}</td>
                    <td>
                      <span className={`badge ${d.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'}`}>
                        {d.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(d)}
                          className="btn-ghost btn-sm"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDelTarget(d)}
                          className="btn-sm inline-flex items-center gap-1 text-red-500 hover:bg-red-50 rounded-xl px-3 py-1.5 transition"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <DoctorModal
          doctor={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchDoctors(); }}
        />
      )}

      {/* Delete confirm */}
      {delTarget && (
        <ConfirmDelete
          doctor={delTarget}
          onClose={() => setDelTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
