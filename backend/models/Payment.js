const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    pidx: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    amount: {
      type: Number, // in Paisa or Rupees (let's stick to Rupees for consistency, but Khalti accepts Paisa, so we can document it!)
      required: true,
    },
    paymentDetails: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
