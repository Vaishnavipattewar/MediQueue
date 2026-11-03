const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    // Auto-incremented per doctor per day
    tokenNumber: {
      type: Number,
      required: true,
    },
    // pending → confirmed → in-progress → completed | cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    // online or offline consultation
    type: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    // 0 = normal, 1 = high priority (e.g. emergency)
    priority: {
      type: Number,
      default: 0,
    },
    prescription: { type: String, default: '' },
    notes:        { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: { type: String },
    paymentOrderId: { type: String }
}, { timestamps: true });


// Index for fast queue queries
appointmentSchema.index({ doctor: 1, date: 1, tokenNumber: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
