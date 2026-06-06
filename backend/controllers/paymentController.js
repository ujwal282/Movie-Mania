const axios = require('axios');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const KHALTI_INITIATE_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';
const KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';

// @desc    Initiate Khalti Payment
// @route   POST /api/payments/initiate
// @access  Private
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const user = req.user;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId).populate('showtime');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot initiate payment. Booking is already ${booking.status}` });
    }

    // Amount in Paisa (1 NRS = 100 Paisa)
    const amountInPaisa = booking.totalAmount * 100;

    // Detect the dynamic origin (perfect for ngrok)
    const detectedOrigin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const clientUrl = process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost:5173') 
      ? process.env.CLIENT_URL 
      : detectedOrigin;

    const payload = {
      return_url: `${clientUrl}/payment-callback`,
      website_url: clientUrl,
      amount: amountInPaisa,
      purchase_order_id: booking._id.toString(),
      purchase_order_name: `Movie Ticket Booking - ${booking.bookingId}`,
      customer_info: {
        name: user.name,
        email: user.email,
        phone: '9800000000', // default test phone for sandbox
      },
    };

    const headers = {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY || '8209e761df1846b4bb963624e542fb5b'}`,
      'Content-Type': 'application/json',
    };

    console.log('Initiating Khalti payment for amount:', amountInPaisa, 'paisa');
    const response = await axios.post(KHALTI_INITIATE_URL, payload, { headers });

    if (response.data && response.data.pidx) {
      const { pidx, payment_url } = response.data;

      // Check if a payment record already exists for this booking
      let payment = await Payment.findOne({ booking: booking._id });
      if (payment) {
        payment.pidx = pidx;
        payment.amount = booking.totalAmount;
        payment.status = 'Pending';
        await payment.save();
      } else {
        payment = await Payment.create({
          booking: booking._id,
          pidx,
          amount: booking.totalAmount,
          status: 'Pending',
        });
      }

      return res.json({
        success: true,
        pidx,
        paymentUrl: payment_url,
      });
    } else {
      return res.status(500).json({ message: 'Failed to initiate payment with Khalti API' });
    }
  } catch (error) {
    console.error('Khalti initiate payment error:', error.response ? error.response.data : error.message);
    return res.status(500).json({
      message: 'Error communicating with Khalti payment service',
      error: error.response ? error.response.data : error.message,
    });
  }
};

// @desc    Verify Khalti Payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: 'pidx is required for payment verification' });
    }

    // Find the payment record
    const payment = await Payment.findOne({ pidx }).populate('booking');
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this pidx' });
    }

    const payload = { pidx };
    const headers = {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY || '8209e761df1846b4bb963624e542fb5b'}`,
      'Content-Type': 'application/json',
    };

    console.log('Looking up Khalti payment for pidx:', pidx);
    const response = await axios.post(KHALTI_LOOKUP_URL, payload, { headers });

    const khaltiStatus = response.data.status;
    const transactionId = response.data.transaction_id;

    payment.paymentDetails = response.data;

    if (khaltiStatus === 'Completed') {
      payment.status = 'Completed';
      payment.transactionId = transactionId;
      await payment.save();

      // Confirm the booking — but only if it hasn't been auto-cancelled due to expiry
      const booking = await Booking.findById(payment.booking._id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      if (booking.status === 'Cancelled') {
        return res.status(410).json({
          success: false,
          message: 'Your booking was automatically cancelled because payment was not completed within 15 minutes. The seats have been released. Please create a new booking.',
        });
      }

      booking.status = 'Confirmed';
      booking.expiresAt = null; // clear expiry once confirmed
      await booking.save();

      return res.json({
        success: true,
        message: 'Payment completed and booking confirmed successfully',
        booking,
      });
    } else {
      payment.status = 'Failed';
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: `Payment status is ${khaltiStatus}`,
        status: khaltiStatus,
      });
    }
  } catch (error) {
  console.error("FULL KHALTI ERROR:");
  console.error(error.response?.data);
  console.error(error.message);

  return res.status(500).json({
    message: "Error communicating with Khalti payment service",
    error: error.response?.data || error.message,
  });
}
};
