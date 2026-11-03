const express = require('express');
const router  = express.Router();
const {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  getQueueStatus,
  createPaymentOrder,
  verifyPayment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Public – queue status board
router.get('/queue/:doctorId', getQueueStatus);

// Protected routes
router.post('/:id/payment/order', protect, authorize('patient'), createPaymentOrder);
router.post('/:id/payment/verify', protect, authorize('patient'), verifyPayment);
router.route('/')
  .get(protect, getAppointments)
  .post(protect, authorize('patient'), bookAppointment);

router.route('/:id')
  .get(protect, getAppointment)
  .put(protect, updateAppointment);

module.exports = router;
