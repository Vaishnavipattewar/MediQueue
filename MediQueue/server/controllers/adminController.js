const User        = require('../models/User');
const Doctor      = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// ─── @desc    Get admin dashboard statistics ──────────────────────────────────
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);

    // Today's appointments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: todayStart, $lt: todayEnd },
    });

    // Revenue: sum of doctor fees for all completed appointments
    const revenueData = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from:         'doctors',
          localField:   'doctor',
          foreignField: '_id',
          as:           'doctorInfo',
        },
      },
      { $unwind: '$doctorInfo' },
      { $group: { _id: null, totalRevenue: { $sum: '$doctorInfo.fee' } } },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        todayAppointments,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Create an admin or doctor user account ─────────────────────────
// @route   POST /api/admin/create-user
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, phone });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get all users ───────────────────────────────────────────────────
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


// Resource optimization insights for today's hospital operations.
// Capacity is an explicit planning assumption (20 appointments/doctor/day).
const getResourceInsights = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [doctors, appointments] = await Promise.all([
      Doctor.find({ isAvailable: true }).select('name specialization'),
      Appointment.find({ date: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } })
        .populate('doctor', 'name specialization'),
    ]);

    const CAPACITY_PER_DOCTOR = 20;
    const workload = doctors.map((doctor) => {
      const assigned = appointments.filter((a) => a.doctor && a.doctor._id.toString() === doctor._id.toString());
      const active = assigned.filter((a) => ['pending', 'confirmed', 'in-progress'].includes(a.status)).length;
      return {
        doctorId: doctor._id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        totalAppointments: assigned.length,
        activeAppointments: active,
        completedAppointments: assigned.filter((a) => a.status === 'completed').length,
        capacity: CAPACITY_PER_DOCTOR,
        utilizationPercent: Math.min(100, Math.round((assigned.length / CAPACITY_PER_DOCTOR) * 100)),
      };
    }).sort((a, b) => b.utilizationPercent - a.utilizationPercent);

    const demandMap = {};
    appointments.forEach((a) => {
      const spec = a.doctor?.specialization || 'Unassigned';
      demandMap[spec] = (demandMap[spec] || 0) + 1;
    });
    const departmentDemand = Object.entries(demandMap)
      .map(([specialization, appointments]) => ({ specialization, appointments }))
      .sort((a, b) => b.appointments - a.appointments);

    const recommendations = [];
    const busiest = workload[0];
    if (busiest && busiest.utilizationPercent >= 80) {
      recommendations.push(`${busiest.doctorName} has high scheduled utilization (${busiest.utilizationPercent}%). Consider shifting new bookings to another available doctor in ${busiest.specialization}.`);
    }
    if (departmentDemand.length > 0) {
      recommendations.push(`${departmentDemand[0].specialization} has the highest appointment demand today (${departmentDemand[0].appointments} appointments).`);
    }
    const idle = workload.filter((d) => d.totalAppointments === 0);
    if (idle.length) recommendations.push(`${idle.length} available doctor(s) have no appointments today. Consider directing suitable new bookings to them.`);
    if (!recommendations.length) recommendations.push('Current workload is within the configured planning capacity. Continue monitoring the live queue.');

    res.json({ success: true, data: { date: start.toISOString().slice(0, 10), capacityAssumptionPerDoctor: CAPACITY_PER_DOCTOR, workload, departmentDemand, recommendations } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to generate resource insights', error: error.message });
  }
};

module.exports = { getStats, createUser, getUsers, getResourceInsights };
