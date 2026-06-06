const express = require('express');
const { createBooking, getBookingHistory, getBookingById, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); 

router.post('/', createBooking);
router.get('/history', getBookingHistory);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

module.exports = router;
