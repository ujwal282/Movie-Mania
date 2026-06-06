import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, MapPin, XCircle, RefreshCw, Printer, CreditCard, Clock } from 'lucide-react';

// Format remaining seconds into mm:ss
const formatCountdown = (secs) => {
  if (secs <= 0) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Per-booking live countdown component
const ExpiryCountdown = ({ expiresAt }) => {
  const calcRemaining = useCallback(() => {
    const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }, [expiresAt]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [calcRemaining]);

  if (remaining <= 0) {
    return (
      <span className="text-xs font-mono font-semibold" style={{ color: '#f87171' }}>
        Expired
      </span>
    );
  }

  const isUrgent = remaining < 120; // < 2 minutes

  return (
    <span
      className="text-xs font-mono font-bold inline-flex items-center gap-1"
      style={{ color: isUrgent ? '#f87171' : '#fbbf24' }}
    >
      <Clock size={11} />
      {formatCountdown(remaining)}
    </span>
  );
};

export const BookingHistory = () => {
  const { api } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password tab and form state
  const [activeTab, setActiveTab] = useState('bookings'); // bookings | security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }

    try {
      setUpdatingPass(true);
      await api.put('/api/auth/changepassword', { currentPassword, newPassword });
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setUpdatingPass(false);
    }
  };

  useEffect(() => { fetchBookingsList(); }, []);

  const fetchBookingsList = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/api/bookings/history');
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setErrorMsg('Failed to retrieve booking history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? Your seats will be released.')) return;
    try {
      setCancellingId(bookingId);
      setErrorMsg('');
      setMessage('');
      const response = await api.post(`/api/bookings/${bookingId}/cancel`);
      setMessage(response.data.message || 'Booking cancelled successfully.');
      fetchBookingsList();
    } catch (err) {
      console.error('Cancellation error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayNow = async (booking) => {
    try {
      setPayingId(booking._id);
      setErrorMsg('');
      setMessage('');
      const res = await api.post('/api/payments/initiate', { bookingId: booking._id });
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setErrorMsg('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('Pay now error:', err);
      setErrorMsg(err.response?.data?.message || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  };

  const isEligibleForCancel = (showtimeDate) => new Date(showtimeDate) > new Date();

  const isExpiredLocally = (expiresAt) => expiresAt && new Date(expiresAt) <= new Date();

  const handlePrintTicket = (booking) => {
    const printWindow = window.open('', '_blank');
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const theater = showtime.theater || {};
    const html = `
      <html>
        <head>
          <title>Movies Mania — Ticket #${booking.bookingId}</title>
          <style>
            body { background: #fff; color: #000; font-family: 'Inter', sans-serif; padding: 40px; }
            .ticket { border: 2px solid #000; padding: 30px; max-width: 500px; margin: 0 auto; border-radius: 12px; }
            h2 { text-align: center; border-bottom: 1px dashed #999; padding-bottom: 15px; margin-bottom: 20px; font-size: 18px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .label { color: #666; }
            .footer { border-top: 1px dashed #999; padding-top: 15px; margin-top: 20px; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>Movies Mania — Ticket</h2>
            <div class="row"><span class="label">Booking ID</span><span>${booking.bookingId}</span></div>
            <div class="row"><span class="label">Movie</span><span>${movie.title || 'N/A'}</span></div>
            <div class="row"><span class="label">Theater</span><span>${theater.name || 'N/A'}</span></div>
            <div class="row"><span class="label">Date</span><span>${new Date(showtime.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            <div class="row"><span class="label">Time</span><span>${new Date(showtime.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="row"><span class="label">Seats</span><span>${booking.seatNumbers?.join(', ') || 'N/A'}</span></div>
            <div class="row"><span class="label">Amount Paid</span><span>NRS ${booking.totalAmount}</span></div>
            <div class="row"><span class="label">Status</span><span>${booking.status}</span></div>
            <div class="footer">Present this slip at the entrance gate.<br>© ${new Date().getFullYear()} Movies Mania</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const statusStyle = (status) => {
    if (status === 'Confirmed') return { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' };
    if (status === 'Pending') return { backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' };
    return { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' };
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-10 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <span>Account Dashboard</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage your profile, security, and ticket reservations
          </p>
        </div>
        {activeTab === 'bookings' && (
          <button onClick={fetchBookingsList} className="btn btn-ghost flex items-center gap-2">
            <RefreshCw size={13} />
            Refresh
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setActiveTab('bookings')}
          className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer relative"
          style={{
            color: activeTab === 'bookings' ? 'var(--text)' : 'var(--text-muted)',
            borderBottom: activeTab === 'bookings' ? '2px solid var(--text)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Booking History
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer relative"
          style={{
            color: activeTab === 'security' ? 'var(--text)' : 'var(--text-muted)',
            borderBottom: activeTab === 'security' ? '2px solid var(--text)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Security & Password
        </button>
      </div>

      {activeTab === 'security' ? (
        <div className="max-w-md rounded-xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Update Password
          </h2>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Change your password to keep your account secure.
          </p>

          {passError && <div className="alert-error mb-4">{passError}</div>}
          {passSuccess && (
            <div className="mb-4 rounded-lg px-4 py-2.5 text-xs"
                 style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="label">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPass}
              className="btn btn-primary w-full"
              style={{ padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {updatingPass ? 'Updating password…' : 'Update Password'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Feedback */}
          {errorMsg && <div className="alert-error mb-5">{errorMsg}</div>}
          {message && (
            <div className="mb-5 rounded-lg px-4 py-3 text-sm"
                 style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
              {message}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24" style={{ color: 'var(--text-muted)' }}>
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                   style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text)' }} />
              <span className="text-sm">Loading bookings…</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-24 text-center rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Ticket size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No bookings found. Book a movie to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => {
                const showtime = booking.showtime || {};
                const movie = showtime.movie || {};
                const theater = showtime.theater || {};
                const isFuture = isEligibleForCancel(showtime.dateTime);
                const canCancel = booking.status !== 'Cancelled' && booking.status !== 'Confirmed' && isFuture;
                const isPending = booking.status === 'Pending';
                const stillLive = isPending && booking.expiresAt && !isExpiredLocally(booking.expiresAt);

                return (
                  <div
                    key={booking._id}
                    className="rounded-xl overflow-hidden transition-colors"
                    style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${isPending && stillLive ? 'rgba(234,179,8,0.35)' : 'var(--border)'}` }}
                  >
                    {/* Pending payment banner with live countdown */}
                    {isPending && booking.expiresAt && (
                      <div
                        className="px-5 py-2.5 flex items-center justify-between gap-3 text-xs font-medium"
                        style={{
                          backgroundColor: stillLive ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)',
                          borderBottom: `1px solid ${stillLive ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}
                      >
                        <div className="flex items-center gap-2" style={{ color: stillLive ? '#fbbf24' : '#f87171' }}>
                          <Clock size={13} />
                          {stillLive
                            ? <>Payment window expires in: <ExpiryCountdown expiresAt={booking.expiresAt} /></>
                            : 'Payment window expired — booking will be auto-cancelled shortly'
                          }
                        </div>
                        {stillLive && (
                          <button
                            disabled={payingId === booking._id}
                            onClick={() => handlePayNow(booking)}
                            className="btn flex items-center gap-1.5"
                            style={{
                              padding: '0.35rem 0.9rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#fbbf24',
                              color: '#000',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              opacity: payingId === booking._id ? 0.6 : 1,
                            }}
                          >
                            <CreditCard size={12} />
                            {payingId === booking._id ? 'Opening…' : 'Pay Now'}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex flex-col sm:flex-row justify-between gap-5">
                      {/* Left */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}>
                            #{booking.bookingId}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={statusStyle(booking.status)}>
                            {booking.status}
                          </span>
                        </div>

                        <div>
                          <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                            {movie.title || 'Unknown Movie'}
                          </h2>
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                              <MapPin size={12} />
                              {theater.name || 'Unknown Theater'}{theater.address ? ` · ${theater.address}` : ''}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                              <Calendar size={12} />
                              {showtime.dateTime && new Date(showtime.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' at '}
                              {showtime.dateTime && new Date(showtime.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 pt-3 text-sm"
                             style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <div>
                            Seats: <span className="font-semibold" style={{ color: 'var(--text)' }}>{booking.seatNumbers?.join(', ')}</span>
                          </div>
                          <div>
                            Total: <span className="font-semibold" style={{ color: 'var(--text)' }}>NRS {booking.totalAmount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 items-end justify-end sm:border-l sm:pl-5"
                           style={{ borderColor: 'var(--border)' }}>
                        {booking.status === 'Confirmed' && (
                          <button onClick={() => handlePrintTicket(booking)} className="btn btn-ghost flex items-center gap-1.5">
                            <Printer size={13} />
                            Print
                          </button>
                        )}
                        {canCancel && booking.status !== 'Pending' && booking.status !== 'Confirmed' && (
                          <button
                            disabled={cancellingId === booking._id}
                            onClick={() => handleCancelBooking(booking._id)}
                            className="btn btn-ghost flex items-center gap-1.5 cursor-pointer"
                            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                          >
                            <XCircle size={13} />
                            {cancellingId === booking._id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        )}
                        {isPending && canCancel && (
                          <button
                            disabled={cancellingId === booking._id}
                            onClick={() => handleCancelBooking(booking._id)}
                            className="btn btn-ghost flex items-center gap-1.5 cursor-pointer"
                            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                          >
                            <XCircle size={13} />
                            {cancellingId === booking._id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        )}
                        {!isFuture && booking.status !== 'Cancelled' && (
                          <span className="text-xs px-2 py-1 rounded"
                                style={{ color: 'var(--text-dim)', backgroundColor: 'var(--bg-subtle)' }}>
                            Past Show
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default BookingHistory;
