const Doctor = require('../models/Doctor');
const User   = require('../models/User');

// ─── @desc    Get all available doctors ──────────────────────────────────────
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: true }).sort({ name: 1 });
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get ALL doctors (including unavailable) – admin only ─────────────
// @route   GET /api/doctors/all
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get single doctor ───────────────────────────────────────────────
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get the doctor profile for the logged-in doctor user ────────────
// @route   GET /api/doctors/my-profile
// @access  Private/Doctor
const getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Add a new doctor ────────────────────────────────────────────────
// @route   POST /api/doctors
// @access  Private/Admin
const addDoctor = async (req, res) => {
  try {
    const {
      name, specialization, qualification, experience,
      fee, phone, email, meetingLink,
      createAccount, password,
    } = req.body;

    let userId = null;

    // Optionally create a login account for the doctor
    if (createAccount && email && password) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists' });
      }
      const doctorUser = await User.create({ name, email, password, role: 'doctor' });
      userId = doctorUser._id;
    }

    const doctor = await Doctor.create({
      name, specialization, qualification, experience,
      fee, phone, email, meetingLink, userId,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Update a doctor ─────────────────────────────────────────────────
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Delete a doctor ─────────────────────────────────────────────────
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Also remove the linked user account if it exists
    if (doctor.userId) await User.findByIdAndDelete(doctor.userId);

    await doctor.deleteOne();
    res.json({ success: true, message: 'Doctor removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getDoctors, getAllDoctors, getDoctor, getMyProfile, addDoctor, updateDoctor, deleteDoctor };
