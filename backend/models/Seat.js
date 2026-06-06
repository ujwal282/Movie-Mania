const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    col: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Regular', 'VIP'],
      default: 'Regular',
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent creating duplicate seat configurations for a showtime
seatSchema.index({ showtime: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
