const express = require('express');
const router  = express.Router();
const {
  getDoctors, getAllDoctors, getDoctor, getMyProfile,
  addDoctor, updateDoctor, deleteDoctor,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// NOTE: /my-profile must come before /:id to avoid route conflict
router.get('/my-profile', protect, authorize('doctor'), getMyProfile);
router.get('/all',        protect, authorize('admin'),  getAllDoctors);

router.route('/')
  .get(getDoctors)
  .post(protect, authorize('admin'), addDoctor);

router.route('/:id')
  .get(getDoctor)
  .put(protect,    authorize('admin'), updateDoctor)
  .delete(protect, authorize('admin'), deleteDoctor);

module.exports = router;
