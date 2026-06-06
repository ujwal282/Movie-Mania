const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const Theater = require('../models/Theater');
const { calculateDynamicPrice } = require('../utils/pricing');

// Helper to generate seat map rows
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// @desc    Get showtimes for a specific movie or theater
// @route   GET /api/showtimes
// @access  Public
exports.getShowtimes = async (req, res) => {
  try {
    const { movie, theater, date } = req.query;
    const query = {};

    if (movie) query.movie = movie;
    if (theater) query.theater = theater;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.dateTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const showtimes = await Showtime.find(query)
      .populate('movie')
      .populate('theater')
      .sort({ dateTime: 1 });

    return res.json(showtimes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving showtimes' });
  }
};

// @desc    Get single showtime detail with seat layout and dynamic pricing
// @route   GET /api/showtimes/:id
// @access  Public
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie')
      .populate('theater');

    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    const theater = showtime.theater;
    if (!theater) {
      return res.status(404).json({ message: 'Theater details not found for showtime' });
    }

    // 1. Fetch current seats for this showtime
    let seats = await Seat.find({ showtime: showtime._id }).sort({ row: 1, col: 1 });

    // 2. Auto-initialize seats if they don't exist yet
    const expectedSeatsCount = theater.rows * theater.cols;
    if (seats.length === 0) {
      const seatsToCreate = [];
      for (let r = 0; r < theater.rows; r++) {
        const rowLetter = ROW_LETTERS[r] || `R${r + 1}`;
        for (let c = 1; c <= theater.cols; c++) {
          // Let's make G and H (or the last 2 rows) VIP rows
          const type = (r >= theater.rows - 2) ? 'VIP' : 'Regular';
          seatsToCreate.push({
            showtime: showtime._id,
            seatNumber: `${rowLetter}${c}`,
            row: rowLetter,
            col: c,
            type,
            isBooked: false,
          });
        }
      }
      seats = await Seat.insertMany(seatsToCreate);
    }

    // 3. Apply Dynamic Pricing Algorithm
    const totalSeatsCount = seats.length;
    const bookedSeatsCount = seats.filter(s => s.isBooked).length;

    const seatsWithDynamicPricing = seats.map(seat => {
      const pricingDetails = calculateDynamicPrice({
        basePrice: showtime.basePrice,
        seatType: seat.type,
        dateTime: showtime.dateTime,
        popularityMultiplier: showtime.popularityMultiplier,
        totalSeatsCount,
        bookedSeatsCount
      });

      return {
        ...seat.toObject(),
        price: pricingDetails.finalPrice,
        pricingFactors: {
          isWeekend: pricingDetails.isWeekend,
          isPeakHour: pricingDetails.isPeakHour,
          isLowAvailability: pricingDetails.isLowAvailability,
          basePrice: pricingDetails.basePrice,
          multipliers: {
            seatType: pricingDetails.seatTypeMultiplier,
            weekend: pricingDetails.weekendMultiplier,
            popularity: pricingDetails.popularityMultiplier,
            demand: pricingDetails.demandMultiplier
          }
        }
      };
    });

    return res.json({
      showtime,
      totalSeats: totalSeatsCount,
      bookedSeats: bookedSeatsCount,
      availableSeats: totalSeatsCount - bookedSeatsCount,
      seats: seatsWithDynamicPricing
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Showtime not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving showtime details' });
  }
};
