
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');

const SWEEP_INTERVAL_MS = 60 * 1000; // every 60 seconds

const sweepExpiredBookings = async () => {
  try {
    const now = new Date();

    // Find all Pending bookings that have passed their payment deadline
    const expired = await Booking.find({
      status: 'Pending',
      expiresAt: { $lte: now, $ne: null },
    }).select('_id seats bookingId');

    if (expired.length === 0) return;

    const expiredIds = expired.map((b) => b._id);
    const seatIds = expired.flatMap((b) => b.seats);

    // Release all reserved seats in one bulk operation
    if (seatIds.length > 0) {
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { isBooked: false, bookedBy: null } }
      );
    }

    // Cancel all expired bookings in one bulk operation
    await Booking.updateMany(
      { _id: { $in: expiredIds } },
      { $set: { status: 'Cancelled' } }
    );

    const codes = expired.map((b) => b.bookingId).join(', ');
    console.log(
      `[BookingExpiry] ${expired.length} booking(s) auto-cancelled and ${seatIds.length} seat(s) released — IDs: ${codes}`
    );
  } catch (err) {
    console.error('[BookingExpiry] Error during expiry sweep:', err.message);
  }
};

/**
 * Start the expiry sweeper.
 * Call once from server.js after DB connects.
 */
const startBookingExpirySweeper = () => {
  console.log(
    `[BookingExpiry] Sweeper started — checking every ${SWEEP_INTERVAL_MS / 1000}s for expired pending bookings.`
  );
  // Run immediately on startup to catch any bookings that expired while server was down
  sweepExpiredBookings();
  // Then repeat on the interval
  setInterval(sweepExpiredBookings, SWEEP_INTERVAL_MS);
};

module.exports = { startBookingExpirySweeper };
