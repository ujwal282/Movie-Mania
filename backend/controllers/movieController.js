const Movie = require('../models/Movie');

// @desc    Get all movies with optional search, filter, and status
// @route   GET /api/movies
// @access  Public
exports.getMovies = async (req, res) => {
  try {
    const { search, genre, status } = req.query;

    const query = {};

    // Filter by status (default is Running for standard users, but admins might want to query all)
    if (status) {
      query.status = status;
    } else {
      // By default, show Running movies for standard browsing
      query.status = 'Running';
    }

    // Search by title (case-insensitive regex)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by genre (case-insensitive regex or exact match)
    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }

    const movies = await Movie.find(query).sort({ releaseDate: -1 });
    return res.json(movies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving movies', error: error.message });
  }
};

// @desc    Get single movie details
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    return res.json(movie);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    return res.status(500).json({ message: 'Server error retrieving movie', error: error.message });
  }
};
