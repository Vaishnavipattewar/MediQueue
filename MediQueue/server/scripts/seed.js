/**
 * Seed Script – run with: npm run seed
 * Creates default admin, a demo doctor user, and sample doctor profiles.
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config({ path: '../.env' });

// Fallback for running from /scripts directory
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hospital-queue';

const User        = require('../models/User');
const Doctor      = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear existing data ──────────────────────────────────────────────────
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Create Admin ─────────────────────────────────────────────────────────
    const admin = await User.create({
      name:     'Admin User',
      email:    'admin@hospital.com',
      password: 'admin123',
      role:     'admin',
      phone:    '+1-000-000-0000',
    });
    console.log('👤 Admin created:', admin.email);

    // ── Create Doctor Users ───────────────────────────────────────────────────
    const doctorUser1 = await User.create({
      name:     'Dr. Sarah Johnson',
      email:    'sarah@hospital.com',
      password: 'doctor123',
      role:     'doctor',
    });

    const doctorUser2 = await User.create({
      name:     'Dr. Michael Chen',
      email:    'michael@hospital.com',
      password: 'doctor123',
      role:     'doctor',
    });

    // ── Create Doctor Profiles ────────────────────────────────────────────────
    const doctors = await Doctor.insertMany([
      {
        name:           'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        qualification:  'MD, FACC',
        experience:     12,
        fee:            800,
        phone:          '+1-555-101-0001',
        email:          'sarah@hospital.com',
        meetingLink:    'https://meet.google.com/demo-cardio',
        isAvailable:    true,
        userId:         doctorUser1._id,
      },
      {
        name:           'Dr. Michael Chen',
        specialization: 'Neurology',
        qualification:  'MD, PhD',
        experience:     9,
        fee:            1000,
        phone:          '+1-555-101-0002',
        email:          'michael@hospital.com',
        meetingLink:    'https://meet.google.com/demo-neuro',
        isAvailable:    true,
        userId:         doctorUser2._id,
      },
      {
        name:           'Dr. Priya Patel',
        specialization: 'Dermatology',
        qualification:  'MBBS, MD',
        experience:     7,
        fee:            600,
        phone:          '+1-555-101-0003',
        email:          'priya@hospital.com',
        meetingLink:    '',
        isAvailable:    true,
      },
      {
        name:           'Dr. James Wilson',
        specialization: 'Orthopedics',
        qualification:  'MS Ortho',
        experience:     15,
        fee:            900,
        phone:          '+1-555-101-0004',
        email:          'james@hospital.com',
        isAvailable:    true,
      },
      {
        name:           'Dr. Emily Davis',
        specialization: 'Pediatrics',
        qualification:  'MD, DCH',
        experience:     5,
        fee:            500,
        phone:          '+1-555-101-0005',
        email:          'emily@hospital.com',
        meetingLink:    'https://meet.google.com/demo-peds',
        isAvailable:    true,
      },
    ]);

    console.log(`👨‍⚕️  ${doctors.length} doctors created`);

    // ── Create a demo patient ─────────────────────────────────────────────────
    const patient = await User.create({
      name:     'John Patient',
      email:    'patient@hospital.com',
      password: 'patient123',
      role:     'patient',
      phone:    '+1-555-200-0001',
      age:      32,
      gender:   'male',
    });
    console.log('🧑 Demo patient created:', patient.email);

    console.log('\n✅ Seed complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Admin   → admin@hospital.com  / admin123');
    console.log('  Doctor  → sarah@hospital.com  / doctor123');
    console.log('  Doctor  → michael@hospital.com/ doctor123');
    console.log('  Patient → patient@hospital.com/ patient123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
