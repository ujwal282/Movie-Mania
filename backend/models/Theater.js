const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a theater name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Please add latitude'],
      },
      longitude: {
        type: Number,
        required: [true, 'Please add longitude'],
      },
    },
    graphNode: {
      type: String,
      required: false,
    },
    rows: {
      type: Number,
      default: 8,
    },
    cols: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Theater', theaterSchema);
