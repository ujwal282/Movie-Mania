import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, Loader, Ticket, ArrowRight } from 'lucide-react';

export const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { api } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);   // booking auto-cancelled due to timeout
  const [booking, setBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pidx = searchParams.get('pidx');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!pidx) {
        setVerifying(false);
        setSuccess(false);
        setErrorMsg('Invalid payment parameters. Please contact support.');
        return;
      }
      try {
        setVerifying(true);
        const res = await api.post('/api/payments/verify', { pidx });
        if (res.data?.success) {
          setSuccess(true);
          const bookingRes = await api.get(`/api/bookings/${res.data.booking._id}`);
          setBooking(bookingRes.data);
        } else {
          setSuccess(false);
          setErrorMsg(res.data.message || 'Payment verification failed.');
        }
      } catch (err) {
        console.error('Payment callback error:', err);
        // HTTP 410 = booking was auto-cancelled due to payment timeout
        if (err.response?.status === 410) {
          setExpired(true);
        } else {
          setErrorMsg(err.response?.data?.message || 'Failed to verify payment. Please try again.');
        }
        setSuccess(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyTransaction();
  }, [pidx]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
         style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        {/* Verifying */}
        {verifying && (
          <div className="rounded-xl p-10 text-center space-y-5"
               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto"
                 style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text)' }} />
            <div>
              <h2 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Verifying payment…
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Confirming your transaction with Khalti. Please wait.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {!verifying && success && booking && (
          <div className="rounded-xl overflow-hidden"
               style={{ border: '1px solid var(--border)' }}>
            {/* Green success header */}
            <div className="px-6 py-8 text-center"
                 style={{ backgroundColor: 'rgba(34,197,94,0.06)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle size={28} style={{ color: '#22c55e' }} />
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                Booking Confirmed!
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Reference: <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
                  #{booking.bookingId}
                </span>
              </p>
            </div>

            {/* Ticket details */}
            <div className="px-6 py-5 space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
              {[
                { label: 'Movie', value: booking.showtime?.movie?.title },
                { label: 'Theater', value: booking.showtime?.theater?.name },
                { label: 'Date', value: new Date(booking.showtime?.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Time', value: new Date(booking.showtime?.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Seats', value: booking.seatNumbers?.join(', ') },
                { label: 'Amount Paid', value: `NRS ${booking.totalAmount}` },
                { label: 'Transaction ID', value: transactionId || 'SANDBOX_COMPLETED', mono: true },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-sm py-2.5"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className={`font-medium text-right max-w-[55%] truncate ${item.mono ? 'font-mono text-xs' : ''}`}
                        style={{ color: 'var(--text)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 py-5 flex gap-3"
                 style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
              <Link to="/history"
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    style={{ textDecoration: 'none' }}>
                <Ticket size={14} />
                My Bookings
              </Link>
              <Link to="/"
                    className="btn btn-ghost flex-1 flex items-center justify-center gap-2"
                    style={{ textDecoration: 'none' }}>
                Browse Movies
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Booking Expired (auto-cancelled) */}
        {!verifying && expired && (
          <div className="rounded-xl overflow-hidden"
               style={{ border: '1px solid rgba(251,191,36,0.3)' }}>
            <div className="px-6 py-8 text-center"
                 style={{ backgroundColor: 'rgba(251,191,36,0.05)', borderBottom: '1px solid rgba(251,191,36,0.15)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: 'rgba(251,191,36,0.12)' }}>
                <Clock size={28} style={{ color: '#fbbf24' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Booking Expired
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.65' }}>
                Your reserved seats were automatically released because payment wasn't completed within
                <strong style={{ color: 'var(--text)' }}> 15 minutes</strong>.
                Please go back and book again.
              </p>
            </div>
            <div className="px-6 py-5 flex gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Link to="/"
                    className="btn btn-primary flex-1 flex items-center justify-center"
                    style={{ textDecoration: 'none' }}>
                Browse Movies
              </Link>
            </div>
          </div>
        )}

        {/* Generic Error */}
        {!verifying && !success && !expired && errorMsg && (
          <div className="rounded-xl overflow-hidden"
               style={{ border: '1px solid var(--border)' }}>
            <div className="px-6 py-8 text-center"
                 style={{ backgroundColor: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                <XCircle size={28} style={{ color: '#f87171' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Payment Failed
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {errorMsg}
              </p>
            </div>
            <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Link to="/"
                    className="btn btn-primary w-full flex items-center justify-center"
                    style={{ textDecoration: 'none' }}>
                Return to Movies
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default PaymentCallback;
