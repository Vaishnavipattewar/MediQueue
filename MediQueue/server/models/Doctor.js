const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: { type: String, trim: true, default: 'MBBS' },
    experience:    { type: Number, default: 0 },
    fee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0,
    },
    phone:       { type: String, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    meetingLink: { type: String, trim: true },  // Telemedicine link
    isAvailable: { type: Boolean, default: true },

    // Linked User account (for doctor login)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
