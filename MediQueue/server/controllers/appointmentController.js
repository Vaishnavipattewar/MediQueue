const Appointment = require('../models/Appointment');
const Doctor      = require('../models/Doctor');

// ─── Helper: get start & end of a day ────────────────────────────────────────
const dayRange = (dateInput) => {
  const start = new Date(dateInput);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// ─── @desc    Book an appointment ────────────────────────────────────────────
// @route   POST /api/appointments
// @access  Private/Patient
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, type, notes } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'doctorId, date and timeSlot are required' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const { start, end } = dayRange(date);

    // Token = count of non-cancelled appointments for this doctor on this day + 1
    const existingCount = await Appointment.countDocuments({
      doctor: doctorId,
      date:   { $gte: start, $lt: end },
      status: { $ne: 'cancelled' },
    });

    const tokenNumber = existingCount + 1;

    const appointment = await Appointment.create({
      patient:     req.user._id,
      doctor:      doctorId,
      date:        new Date(date),
      timeSlot,
      tokenNumber,
      type:        type || 'offline',
      notes:       notes || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor',  'name specialization fee meetingLink')
      .populate('patient', 'name email phone age gender');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get appointments (role-based filtering) ─────────────────────────
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = {};
    const { today, status, date } = req.query;

    if (req.user.role === 'patient') {
      // Patients only see their own
      query.patient = req.user._id;

    } else if (req.user.role === 'doctor') {
      // Find the doctor profile linked to this user
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      query.doctor = doctorProfile._id;

      if (today === 'true') {
        const { start, end } = dayRange(new Date());
        query.date = { $gte: start, $lt: end };
      } else if (date) {
        const { start, end } = dayRange(date);
        query.date = { $gte: start, $lt: end };
      }
    }
    // Admin: no filter → sees everything

    if (status) query.status = status;

    const appointments = await Appointment.find(query)
  .populate('doctor', 'name specialization fee meetingLink')
  .populate('patient', 'name email phone age gender')
  .sort({ date: 1, priority: -1, tokenNumber: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get a single appointment ───────────────────────────────────────
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor',  'name specialization fee meetingLink')
      .populate('patient', 'name email phone age gender');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Update appointment (status / prescription / notes) ──────────────
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

   const { status, prescription, notes } = req.body;

    if (req.user.role === 'patient') {
      // Patients can only cancel their own appointments
      if (appointment.patient.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
     if (status === 'cancelled') {
  appointment.status = 'cancelled';
}
     } else if (req.user.role === 'doctor' || req.user.role === 'admin') {
      if (status)       appointment.status       = status;
      if (prescription !== undefined) appointment.prescription = prescription;
      if (notes !== undefined)        appointment.notes        = notes;
    }

    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('doctor',  'name specialization fee meetingLink')
      .populate('patient', 'name email phone');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── @desc    Get live queue for a doctor on a given date ─────────────────────
// @route   GET /api/appointments/queue/:doctorId
// @access  Public
const getQueueStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const { start, end } = dayRange(targetDate);

    const queue = await Appointment.find({
      doctor: doctorId,
      date:   { $gte: start, $lt: end },
      status: { $ne: 'cancelled' },
    })
      .populate('patient', 'name')
      .sort({ priority: -1, tokenNumber: 1 });

    const serving       = queue.find((a) => a.status === 'in-progress');
    const completedCount = queue.filter((a) => a.status === 'completed').length;
    const waitingCount   = queue.filter((a) => ['pending', 'confirmed'].includes(a.status)).length;

    res.json({
      success: true,
      data: {
        queue,
        currentToken:    serving ? serving.tokenNumber : null,
        completedCount,
        waitingCount,
        totalInQueue:    queue.length,
        avgWaitMinutes:  15, // configurable constant
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


const createPaymentOrder = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('doctor', 'fee');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.patient.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (appointment.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Appointment is already paid' });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ success: false, message: 'Razorpay credentials are not configured' });
    const amount = Math.round(Number(appointment.doctor.fee) * 100);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid consultation fee' });
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify({ amount, currency: 'INR', receipt: `appt_${appointment._id}` }),
    });
    const order = await response.json();
    if (!response.ok) return res.status(502).json({ success: false, message: order.error?.description || 'Unable to create Razorpay order' });
    appointment.paymentOrderId = order.id;
    await appointment.save();
    res.json({ success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment order creation failed', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.patient.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!appointment.paymentOrderId || appointment.paymentOrderId !== razorpay_order_id) return res.status(400).json({ success: false, message: 'Payment order mismatch' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const left = Buffer.from(expected);
    const right = Buffer.from(String(razorpay_signature || ''));
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    appointment.paymentStatus = 'paid';
    appointment.paymentId = razorpay_payment_id;
    await appointment.save();
    res.json({ success: true, message: 'Payment verified', data: { paymentStatus: 'paid' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  getQueueStatus,
  createPaymentOrder,
  verifyPayment,
};
