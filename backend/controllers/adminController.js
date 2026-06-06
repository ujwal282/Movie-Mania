const User = require('../models/User');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');

// ==========================================
// 1. ANALYTICS & STATS
// ==========================================

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBookings = await Booking.countDocuments({ status: 'Confirmed' });
    
    // Sum revenue from confirmed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'Confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get movie booking counts to find most booked movie
    const movieStats = await Booking.aggregate([
      { $match: { status: 'Confirmed' } },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeInfo'
        }
      },
      { $unwind: '$showtimeInfo' },
      {
        $lookup: {
          from: 'movies',
          localField: 'showtimeInfo.movie',
          foreignField: '_id',
          as: 'movieInfo'
        }
      },
      { $unwind: '$movieInfo' },
      {
        $group: {
          _id: '$movieInfo._id',
          title: { $first: '$movieInfo.title' },
          bookingsCount: { $sum: 1 },
          seatsCount: { $sum: { $size: '$seats' } }
        }
      },
      { $sort: { seatsCount: -1 } },
      { $limit: 1 }
    ]);

    const mostBookedMovie = movieStats.length > 0 ? movieStats[0] : { title: 'N/A', seatsCount: 0 };

    // Payment stats
    const paymentCompleted = await Payment.countDocuments({ status: 'Completed' });
    const paymentPending = await Payment.countDocuments({ status: 'Pending' });
    const paymentFailed = await Payment.countDocuments({ status: 'Failed' });

    // Recent Bookings (last 5)
    const recentBookings = await Booking.find({})
      .populate('user', 'name email')
      .populate({
        path: 'showtime',
        populate: [{ path: 'movie', select: 'title' }, { path: 'theater', select: 'name' }]
      })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      stats: {
        totalUsers,
        totalBookings,
        totalRevenue,
        mostBookedMovie: mostBookedMovie.title,
        mostBookedSeats: mostBookedMovie.seatsCount || 0,
      },
      payments: {
        completed: paymentCompleted,
        pending: paymentPending,
        failed: paymentFailed
      },
      recentBookings
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Server error retrieving dashboard statistics', error: error.message });
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving users' });
  }
};

// @desc    Toggle block/unblock user
// @route   PUT /api/admin/users/:id/toggle-block
// @access  Private/Admin
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block administrative accounts' });
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    return res.json({ message: `User status changed to ${user.status}`, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error changing user block status' });
  }
};

// ==========================================
// 3. MOVIE CRUD operations
// ==========================================

// @desc    Add a movie
// @route   POST /api/admin/movies
// @access  Private/Admin
exports.addMovie = async (req, res) => {
  try {
    const { title, genre, language, rating, poster, status, description, duration, releaseDate } = req.body;

    if (!title || !genre || !language || !description || !duration) {
      return res.status(400).json({ message: 'Please specify title, genre, language, description, and duration' });
    }

    let finalPoster = poster || '';
    if (req.file) {
      finalPoster = `/uploads/${req.file.filename}`;
    }

    const movie = await Movie.create({
      title,
      genre,
      language,
      rating: rating || 0,
      poster: finalPoster,
      status: status || 'Upcoming',
      description,
      duration,
      releaseDate
    });

    return res.status(201).json(movie);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding movie', error: error.message });
  }
};

// @desc    Edit a movie
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
exports.editMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.json(updatedMovie);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating movie', error: error.message });
  }
};

// @desc    Delete a movie (sets status to Removed)
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Instead of deleting, mark it as Removed to preserve historical booking references
    movie.status = 'Removed';
    await movie.save();

    return res.json({ message: 'Movie set to Removed status successfully', movie });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error removing movie' });
  }
};

// ==========================================
// 4. THEATER CRUD operations
// ==========================================

// @desc    Add a theater
// @route   POST /api/admin/theaters
// @access  Private/Admin
exports.addTheater = async (req, res) => {
  try {
    const { name, address, latitude, longitude, graphNode, rows, cols } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Please specify name, address, latitude, and longitude' });
    }

    const theater = await Theater.create({
      name,
      address,
      location: { latitude, longitude },
      graphNode: graphNode || `Node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      rows: rows || 8,
      cols: cols || 10
    });

    return res.status(201).json(theater);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding theater', error: error.message });
  }
};

// @desc    Edit a theater
// @route   PUT /api/admin/theaters/:id
// @access  Private/Admin
exports.editTheater = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    const { name, address, latitude, longitude, graphNode, rows, cols } = req.body;
    
    const updateObj = {};
    if (name) updateObj.name = name;
    if (address) updateObj.address = address;
    if (latitude !== undefined && longitude !== undefined) {
      updateObj.location = { latitude, longitude };
    }
    if (graphNode) updateObj.graphNode = graphNode;
    if (rows) updateObj.rows = rows;
    if (cols) updateObj.cols = cols;

    const updatedTheater = await Theater.findByIdAndUpdate(req.params.id, updateObj, {
      new: true,
      runValidators: true
    });

    return res.json(updatedTheater);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error updating theater', error: error.message });
  }
};

// @desc    Delete a theater
// @route   DELETE /api/admin/theaters/:id
// @access  Private/Admin
exports.deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    // Find all showtimes associated with this theater
    const showtimes = await Showtime.find({ theater: req.params.id });
    const showtimeIds = showtimes.map(st => st._id);

    // Delete all seats associated with those showtimes
    if (showtimeIds.length > 0) {
      await Seat.deleteMany({ showtime: { $in: showtimeIds } });
    }

    // Delete all showtimes associated with this theater
    await Showtime.deleteMany({ theater: req.params.id });

    // Delete the theater itself
    await Theater.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Theater and all its associated showtimes and seats deleted successfully' });
  } catch (error) {
    console.error('Error deleting theater:', error);
    return res.status(500).json({ message: 'Server error deleting theater', error: error.message });
  }
};

// ==========================================
// 5. SHOWTIME CRUD operations
// ==========================================

// @desc    Add a showtime
// @route   POST /api/admin/showtimes
// @access  Private/Admin
exports.addShowtime = async (req, res) => {
  try {
    const { movieId, theaterId, dateTime, basePrice, popularityMultiplier } = req.body;

    if (!movieId || !theaterId || !dateTime || !basePrice) {
      return res.status(400).json({ message: 'Please specify movieId, theaterId, dateTime, and basePrice' });
    }

    // Check movie and theater exist
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const theater = await Theater.findById(theaterId);
    if (!theater) return res.status(404).json({ message: 'Theater not found' });

    const showtime = await Showtime.create({
      movie: movieId,
      theater: theaterId,
      dateTime,
      basePrice,
      popularityMultiplier: popularityMultiplier || 1.0
    });

    // Populate for response
    const populated = await Showtime.findById(showtime._id).populate('movie').populate('theater');

    return res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error adding showtime', error: error.message });
  }
};

// @desc    Delete a showtime
// @route   DELETE /api/admin/showtimes/:id
// @access  Private/Admin
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    // Delete associated seats
    await Seat.deleteMany({ showtime: showtime._id });
    
    // Delete showtime
    await Showtime.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Showtime and its seats deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error deleting showtime' });
  }
};

// ==========================================
// 6. BOOKING & PAYMENTS VIEWING
// ==========================================

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user', 'name email')
      .populate({
        path: 'showtime',
        populate: ['movie', 'theater']
      })
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate({
        path: 'booking',
        populate: [
          { path: 'user', select: 'name email' },
          {
            path: 'showtime',
            populate: ['movie', 'theater']
          }
        ]
      })
      .sort({ createdAt: -1 });

    return res.json(payments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving payments' });
  }
};
