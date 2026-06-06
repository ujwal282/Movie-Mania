const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  toggleBlockUser,
  addMovie,
  editMovie,
  deleteMovie,
  addTheater,
  editTheater,
  deleteTheater,
  addShowtime,
  deleteShowtime,
  getAllBookings,
  getAllPayments
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const upload = require('../middleware/upload');

const router = express.Router();

// Require both protection and admin role for all routes in this file
router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-block', toggleBlockUser);

// Movies
router.post('/movies', upload.single('posterFile'), addMovie);
router.put('/movies/:id', editMovie);
router.delete('/movies/:id', deleteMovie);

// Theaters
router.post('/theaters', addTheater);
router.put('/theaters/:id', editTheater);
router.delete('/theaters/:id', deleteTheater);

// Showtimes
router.post('/showtimes', addShowtime);
router.delete('/showtimes/:id', deleteShowtime);

// Bookings & Payments
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);

module.exports = router;
