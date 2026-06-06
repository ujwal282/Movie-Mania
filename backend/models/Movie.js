const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a movie title'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Please add a genre'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Please add a language'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    poster: {
      type: String, // Can be a URL or Base64 string
      default: '',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Running', 'Removed'],
      default: 'Upcoming',
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Please add a duration in minutes'],
    },
    releaseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);
