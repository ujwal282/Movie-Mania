const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please add a movie'],
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater',
      required: [true, 'Please add a theater'],
    },
    dateTime: {
      type: Date,
      required: [true, 'Please add a date and time for showtime'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Please add a base ticket price'],
      min: 0,
    },
    popularityMultiplier: {
      type: Number,
      default: 1.0, // e.g. 1.0 for normal, 1.15 for popular time
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Showtime', showtimeSchema);
