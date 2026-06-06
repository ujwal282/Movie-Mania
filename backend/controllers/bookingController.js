const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Showtime = require('../models/Showtime');
const { calculateDynamicPrice } = require('../utils/pricing');

// Helper to generate a random 5-character string
const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MMB-${result}`;
};

// @desc    Create a draft booking (status Pending)
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user._id;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Please provide showtimeId and seatIds array' });
    }

    // 1. Fetch showtime details
    const showtime = await Showtime.findById(showtimeId).populate('theater');
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    // Check if showtime has already passed
    if (new Date(showtime.dateTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot book seats for a past showtime' });
    }

    // 2. Fetch all requested seats
    const seats = await Seat.find({ _id: { $in: seatIds }, showtime: showtimeId });
    if (seats.length !== seatIds.length) {
      return res.status(404).json({ message: 'One or more selected seats were not found' });
    }

    // Check if any seat is already booked
    const alreadyBooked = seats.some(seat => seat.isBooked);
    if (alreadyBooked) {
      return res.status(400).json({ message: 'One or more selected seats are already booked' });
    }

    // 3. Atomic reservation: Update the seats to isBooked: true, bookedBy: userId
    // To prevent double booking under high concurrency
    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        showtime: showtimeId,
        isBooked: false
      },
      {
        $set: {
          isBooked: true,
          bookedBy: userId
        }
      }
    );

    if (updateResult.modifiedCount !== seatIds.length) {
      // Concurrency issue: someone booked a seat in the split second between find and update.
      // Rollback any seats we might have locked
      await Seat.updateMany(
        { _id: { $in: seatIds }, bookedBy: userId, isBooked: true },
        { $set: { isBooked: false, bookedBy: null } }
      );
      return res.status(409).json({ message: 'Double booking detected. One or more seats were just booked by another user. Please choose different seats.' });
    }

    // 4. Calculate total dynamic price
    const totalSeatsCount = await Seat.countDocuments({ showtime: showtimeId });
    const bookedSeatsCount = await Seat.countDocuments({ showtime: showtimeId, isBooked: true });

    let totalAmount = 0;
    const seatNumbers = [];

    seats.forEach(seat => {
      seatNumbers.push(seat.seatNumber);
      const priceDetails = calculateDynamicPrice({
        basePrice: showtime.basePrice,
        seatType: seat.type,
        dateTime: showtime.dateTime,
        popularityMultiplier: showtime.popularityMultiplier,
        totalSeatsCount,
        bookedSeatsCount
      });
      totalAmount += priceDetails.finalPrice;
    });

    // 5. Generate Booking ID
    let bookingId;
    let isUnique = false;
    while (!isUnique) {
      bookingId = generateRandomId();
      const existing = await Booking.findOne({ bookingId });
      if (!existing) isUnique = true;
    }

    // 6. Create booking document (expires in 15 minutes if not paid)
    const EXPIRY_MINUTES = 15;
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    const booking = await Booking.create({
      user: userId,
      showtime: showtimeId,
      seats: seatIds,
      seatNumbers,
      totalAmount,
      status: 'Pending',
      bookingId,
      expiresAt
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error processing booking request', error: error.message });
  }
};

// @desc    Get booking history for authenticated user
// @route   GET /api/bookings/history
// @access  Private
exports.getBookingHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'theater' }
        ]
      })
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving booking history' });
  }
};

// @desc    Get booking by ID or Code
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie' },
          { path: 'theater' }
        ]
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow user to view their own booking, or admin to view any booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(booking);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving booking details' });
  }
};

// @desc    Cancel booking (before showtime)
// @route   POST /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership or admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Block cancellation after payment is completed
    if (booking.status === 'Confirmed') {
      return res.status(400).json({ message: 'Cannot cancel a confirmed booking. Payment has already been processed.' });
    }

    // Check if showtime has already passed
    if (booking.showtime && new Date(booking.showtime.dateTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel booking after the showtime has started' });
    }

    // 1. Release the seats
    await Seat.updateMany(
      { _id: { $in: booking.seats } },
      { $set: { isBooked: false, bookedBy: null } }
    );

    // 2. Set booking status to Cancelled
    booking.status = 'Cancelled';
    await booking.save();

    return res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error cancelling booking', error: error.message });
  }
};
