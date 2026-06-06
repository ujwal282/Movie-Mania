const Theater = require('../models/Theater');
const { getNearestTheaters } = require('../utils/dijkstra');

// @desc    Get all theaters
// @route   GET /api/theaters
// @access  Public
exports.getTheaters = async (req, res) => {
  try {
    const theaters = await Theater.find({});
    return res.json(theaters);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error retrieving theaters' });
  }
};

// @desc    Get theaters sorted by nearest to coordinates (Dijkstra)
// @route   GET /api/theaters/nearest
// @access  Public
exports.getNearestTheatersList = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Please provide user latitude and longitude' });
    }

    const theaters = await Theater.find({});
    const nearest = getNearestTheaters(latitude, longitude, theaters);

    return res.json(nearest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error calculating nearest theaters' });
  }
};
