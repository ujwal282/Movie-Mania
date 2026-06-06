import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CreditCard, Flame, Clock } from 'lucide-react';

// Format seconds into mm:ss
const formatCountdown = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const SeatSelection = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown state — shown after booking created, before Khalti redirect
  const [countdown, setCountdown] = useState(null); // seconds remaining (null = not started)
  const countdownRef = useRef(null);

  useEffect(() => { fetchShowtimeDetails(); }, [id]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const fetchShowtimeDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get(`/api/showtimes/${id}`);
      setShowtime(res.data.showtime);
      setSeats(res.data.seats);
    } catch (err) {
      console.error('Error fetching showtime:', err);
      setErrorMsg('Failed to load showtime. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds = 15 * 60) => {
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSeatClick = (seat) => {
    if (seat.isBooked) return;
    const isSelected = selectedSeats.some(s => s._id === seat._id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s._id !== seat._id));
    } else {
      if (selectedSeats.length >= 10) {
        setErrorMsg('Maximum 10 seats per booking.');
        return;
      }
      setErrorMsg('');
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const seatsByRow = seats.reduce((rows, seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
    return rows;
  }, {});
  Object.keys(seatsByRow).forEach(r => seatsByRow[r].sort((a, b) => a.col - b.col));

  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/showtimes/${id}` } } });
      return;
    }
    if (selectedSeats.length === 0) {
      setErrorMsg('Please select at least one seat.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      const bookingRes = await api.post('/api/bookings', {
        showtimeId: id,
        seatIds: selectedSeats.map(s => s._id),
      });

      // Start the 15-minute countdown immediately after booking is created
      startCountdown(15 * 60);

      const paymentRes = await api.post('/api/payments/initiate', { bookingId: bookingRes.data._id });
      if (paymentRes.data?.paymentUrl) {
        window.location.href = paymentRes.data.paymentUrl;
      } else {
        clearInterval(countdownRef.current);
        setCountdown(null);
        setErrorMsg('Failed to initiate payment. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      clearInterval(countdownRef.current);
      setCountdown(null);
      setErrorMsg(err.response?.data?.message || 'Checkout failed. Please try again.');
      setSubmitting(false);
      fetchShowtimeDetails();
      setSelectedSeats([]);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
      <div className="w-5 h-5 border-2 rounded-full animate-spin"
           style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text)' }} />
      <span className="text-sm">Loading seats…</span>
    </div>
  );

  if (errorMsg && !showtime) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ color: 'var(--text-muted)' }}>
      <p className="text-sm">{errorMsg}</p>
      <Link to="/" className="btn btn-ghost">Return Home</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 min-h-screen">

      <Link to={`/movies/${showtime?.movie?._id}`}
            className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← Back to showtimes
      </Link>

      {/* Payment countdown banner — shown after booking created while Khalti opens */}
      {countdown !== null && (
        <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
             style={{
               backgroundColor: countdown < 60
                 ? 'rgba(239,68,68,0.08)'
                 : 'rgba(251,191,36,0.07)',
               border: `1px solid ${countdown < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}`,
             }}>
          <Clock size={18} style={{ color: countdown < 60 ? '#f87171' : '#fbbf24', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Complete your payment within{' '}
              <span className="font-mono" style={{ color: countdown < 60 ? '#f87171' : '#fbbf24' }}>
                {formatCountdown(countdown)}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Seats are reserved for 15 minutes. If payment isn't completed in time, the booking will be automatically cancelled and seats released.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SEAT MAP */}
        <div className="lg:col-span-8 rounded-xl p-6 md:p-8 flex flex-col items-center"
             style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {/* Screen */}
          <div className="w-full max-w-lg mb-12">
            <div className="h-1.5 rounded-full mb-2" style={{ background: 'linear-gradient(90deg, transparent, var(--border-mid), transparent)' }} />
            <p className="text-center text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              Screen
            </p>
          </div>

          {/* Seat grid */}
          <div className="space-y-2.5 w-full flex flex-col items-center overflow-x-auto pb-4">
            {Object.keys(seatsByRow).map(rowLetter => (
              <div key={rowLetter} className="flex items-center gap-2 min-w-max">
                <span className="w-5 text-center text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                  {rowLetter}
                </span>
                <div className="flex gap-1.5">
                  {seatsByRow[rowLetter].map(seat => {
                    const isSelected = selectedSeats.some(s => s._id === seat._id);
                    const isVIP = seat.type === 'VIP';

                    let bg, border, color, cursor;
                    if (seat.isBooked) {
                      bg = 'var(--bg-subtle)'; border = 'var(--border)'; color = 'var(--text-dim)'; cursor = 'not-allowed';
                    } else if (isSelected) {
                      bg = 'var(--text)'; border = 'var(--text)'; color = 'var(--bg)'; cursor = 'pointer';
                    } else if (isVIP) {
                      bg = 'transparent'; border = '#a855f7'; color = '#a855f7'; cursor = 'pointer';
                    } else {
                      bg = 'transparent'; border = 'var(--border-mid)'; color = 'var(--text-muted)'; cursor = 'pointer';
                    }

                    return (
                      <button
                        key={seat._id}
                        disabled={seat.isBooked}
                        onClick={() => handleSeatClick(seat)}
                        title={`${seat.seatNumber} (${seat.type}) — NRS ${seat.price}`}
                        className="w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-md border transition-all"
                        style={{ backgroundColor: bg, borderColor: border, color, cursor }}
                      >
                        {seat.col}
                      </button>
                    );
                  })}
                </div>
                <span className="w-5 text-center text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
                  {rowLetter}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-10 pt-6 text-xs"
               style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border inline-block"
                    style={{ borderColor: 'var(--border-mid)', backgroundColor: 'transparent' }} />
              Regular
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border inline-block"
                    style={{ borderColor: '#a855f7', backgroundColor: 'transparent' }} />
              VIP (1.5×)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border inline-block"
                    style={{ borderColor: 'var(--text)', backgroundColor: 'var(--text)' }} />
              Selected
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded border inline-block"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }} />
              Booked
            </div>
          </div>
        </div>

        {/* RIGHT: Summary panel */}
        <div className="lg:col-span-4 space-y-5">

          {/* Show info */}
          <div className="rounded-xl p-5 space-y-1"
               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Show Details
            </h3>
            {[
              { label: 'Movie', value: showtime?.movie?.title },
              { label: 'Theater', value: showtime?.theater?.name },
              { label: 'Time', value: showtime && new Date(showtime.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
              { label: 'Date', value: showtime && new Date(showtime.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { label: 'Base Price', value: `NRS ${showtime?.basePrice}` },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm py-2"
                   style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className="font-medium text-right max-w-[55%] truncate" style={{ color: 'var(--text)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic pricing breakdown */}
          {selectedSeats.length > 0 && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                  style={{ color: 'var(--text-muted)' }}>
                <Flame size={12} />
                Dynamic Pricing
              </h3>
              <div className="space-y-3">
                {selectedSeats.map(seat => {
                  const f = seat.pricingFactors || {};
                  const m = f.multipliers || {};
                  return (
                    <div key={seat._id} className="pb-3 text-xs"
                         style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex justify-between font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                        <span>Seat {seat.seatNumber} ({seat.type})</span>
                        <span>NRS {seat.price}</span>
                      </div>
                      <div className="space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex justify-between">
                          <span>Base</span><span>NRS {f.basePrice}</span>
                        </div>
                        {f.seatType === 'VIP' && (
                          <div className="flex justify-between">
                            <span>VIP multiplier</span><span>×{m.seatType}</span>
                          </div>
                        )}
                        {f.isWeekend && (
                          <div className="flex justify-between">
                            <span>Weekend (+20%)</span><span>×{m.weekend}</span>
                          </div>
                        )}
                        {f.isPeakHour && (
                          <div className="flex justify-between">
                            <span>Peak hour (+15%)</span><span>×1.15</span>
                          </div>
                        )}
                        {f.isLowAvailability && (
                          <div className="flex justify-between">
                            <span>High demand (&lt;20%)</span><span>×{m.demand}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checkout */}
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              Booking Summary
            </h3>

            {errorMsg && (
              <div className="alert-error mb-4 flex items-center gap-2 text-xs">
                <AlertCircle size={13} />
                {errorMsg}
              </div>
            )}

            {/* Payment window notice */}
            {selectedSeats.length > 0 && countdown === null && (
              <div className="rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2"
                   style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <Clock size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  You'll have <strong style={{ color: '#fbbf24' }}>15 minutes</strong> to complete payment once you proceed.
                </p>
              </div>
            )}

            {selectedSeats.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>
                No seats selected yet
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>Seats ({selectedSeats.length})</span>
                  <span className="font-medium max-w-[55%] truncate text-right" style={{ color: 'var(--text)' }}>
                    {selectedSeats.map(s => s.seatNumber).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3"
                     style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>NRS {totalAmount}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="btn btn-primary w-full"
                  style={{ padding: '0.8125rem', marginTop: '0.5rem' }}
                >
                  <CreditCard size={14} />
                  {submitting ? 'Reserving seats…' : 'Pay via Khalti'}
                </button>
                <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
                  Test phone: 9800000000 · PIN: 9800
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
export default SeatSelection;
