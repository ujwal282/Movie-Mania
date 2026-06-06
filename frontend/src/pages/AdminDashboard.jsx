import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Users, Film, Ticket, DollarSign, Calendar, MapPin, 
  Trash2, ShieldX, Plus, RefreshCw, BarChart3, Receipt, Eye, Search, Clock, CreditCard
} from 'lucide-react';

// ── Reusable live countdown component ──
const formatMmSs = (secs) => {
  if (secs <= 0) return '00:00';
  return `${Math.floor(secs / 60).toString().padStart(2,'0')}:${(secs % 60).toString().padStart(2,'0')}`;
};

const ExpiryCountdown = ({ expiresAt }) => {
  const calcRemaining = useCallback(
    () => Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)),
    [expiresAt]
  );
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [calcRemaining]);

  const isUrgent = remaining < 120;
  const expired = remaining <= 0;

  return (
    <span
      className="inline-flex items-center gap-1 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded"
      style={{
        color: expired ? '#f87171' : isUrgent ? '#f87171' : '#fbbf24',
        backgroundColor: expired ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${expired ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.25)'}`,
      }}
    >
      <Clock size={9} />
      {expired ? 'EXPIRED' : formatMmSs(remaining)}
    </span>
  );
};

export const AdminDashboard = () => {
  const { api } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [movieSearch, setMovieSearch] = useState('');
  const [posterFile, setPosterFile] = useState(null);

  // Form states
  const [movieForm, setMovieForm] = useState({
    title: '', genre: '', language: '', rating: 8.0, poster: '', status: 'Running', description: '', duration: 120, releaseDate: ''
  });

  const [theaterForm, setTheaterForm] = useState({
    name: '', address: '', latitude: 27.7, longitude: 85.3, rows: 8, cols: 10
  });

  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '', theaterId: '', dateTime: '', basePrice: 350, popularityMultiplier: 1.0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      if (activeTab === 'analytics') {
        const res = await api.get('/api/admin/dashboard');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/api/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'movies') {
        const resMoviesData = await api.get('/api/movies?status=Running');
        const resMoviesUpcoming = await api.get('/api/movies?status=Upcoming');
        const resMoviesRemoved = await api.get('/api/movies?status=Removed');
        setMovies([...resMoviesData.data, ...resMoviesUpcoming.data, ...resMoviesRemoved.data]);
      } else if (activeTab === 'theaters') {
        const resTheaters = await api.get('/api/theaters');
        setTheaters(resTheaters.data);
      } else if (activeTab === 'showtimes') {
        const resMovies = await api.get('/api/movies?status=Running');
        const resTheaters = await api.get('/api/theaters');
        const resShowtimes = await api.get('/api/showtimes');
        setMovies(resMovies.data);
        setTheaters(resTheaters.data);
        setShowtimes(resShowtimes.data);
      } else if (activeTab === 'payments') {
        const resPayments = await api.get('/api/admin/payments');
        setPayments(resPayments.data);
      } else if (activeTab === 'bookings') {
        const resBookings = await api.get('/api/admin/bookings');
        setBookings(resBookings.data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync administrative ledger.');
    } finally {
      setLoading(false);
    }
  };

  // --- FORM SUBMISSIONS ---

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('title', movieForm.title);
      formData.append('genre', movieForm.genre);
      formData.append('language', movieForm.language);
      formData.append('rating', movieForm.rating);
      formData.append('status', movieForm.status);
      formData.append('description', movieForm.description);
      formData.append('duration', movieForm.duration);
      formData.append('releaseDate', movieForm.releaseDate);
      if (posterFile) {
        formData.append('posterFile', posterFile);
      } else {
        formData.append('poster', movieForm.poster);
      }

      await api.post('/api/admin/movies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMsg('Movie created successfully.');
      setMovieForm({ title: '', genre: '', language: '', rating: 8.0, poster: '', status: 'Running', description: '', duration: 120, releaseDate: '' });
      setPosterFile(null);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add movie.');
    }
  };

  const handleAddTheater = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/api/admin/theaters', theaterForm);
      setSuccessMsg('Theater created successfully.');
      setTheaterForm({ name: '', address: '', latitude: 27.7, longitude: 85.3, rows: 8, cols: 10 });
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add theater.');
    }
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/api/admin/showtimes', showtimeForm);
      setSuccessMsg('Showtime scheduled successfully.');
      setShowtimeForm({ movieId: '', theaterId: '', dateTime: '', basePrice: 350, popularityMultiplier: 1.0 });
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add showtime.');
    }
  };

  const handleDeleteShowtime = async (showId) => {
    if (!window.confirm('WISH TO REMOVE THIS SHOWTIME SLOT AND DELETE ALL IT SEAT STATUSES?')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.delete(`/api/admin/showtimes/${showId}`);
      setSuccessMsg('Showtime deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      setErrorMsg('Failed to delete showtime.');
    }
  };

  const handleDeleteTheater = async (theaterId) => {
    if (!window.confirm('WISH TO REMOVE THIS THEATER? THIS WILL ALSO DELETE ALL SHOWTIMES AND SEATS SCHEDULED FOR IT!')) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.delete(`/api/admin/theaters/${theaterId}`);
      setSuccessMsg('Theater deleted successfully.');
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete theater.');
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.put(`/api/admin/users/${userId}/toggle-block`);
      setSuccessMsg(res.data.message);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg('Failed to toggle user restriction status.');
    }
  };

  const handleToggleMovieStatus = async (movieId, newStatus) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.put(`/api/admin/movies/${movieId}`, { status: newStatus });
      setSuccessMsg('Movie status updated.');
      fetchDashboardData();
    } catch (err) {
      setErrorMsg('Failed to change movie status.');
    }
  };

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPosterFile(file);
  };

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
    movie.genre.toLowerCase().includes(movieSearch.toLowerCase()) ||
    movie.language.toLowerCase().includes(movieSearch.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="page max-w-7xl mx-auto px-6 py-10 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div 
        className="card p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center" style={{ color: 'var(--text)' }}>
            <ShieldAlert className="w-6 h-6 mr-3" style={{ color: 'var(--text)' }} />
            ADMINISTRATIVE PANEL
          </h1>
          <p className="text-xs mt-2 max-w-xl" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Aggregate earnings, register cinematic entities, construct geographical edges for distance calculations, and moderate user lists.
          </p>
        </div>

        <button 
          onClick={fetchDashboardData} 
          className="btn btn-ghost flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          SYNC REGISTRY
        </button>
      </div>

      {/* FEEDBACK SLIPS */}
      {errorMsg && (
        <div className="alert-error mb-6 text-center text-xs font-semibold tracking-wide">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div 
          className="card text-xs font-semibold tracking-wide px-4 py-3 mb-6 text-center"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)', 
            borderColor: 'var(--accent)',
            color: 'var(--text)',
            borderWidth: '1px',
            borderRadius: '8px'
          }}
        >
          {successMsg}
        </div>
      )}

      {/* DASHBOARD NAV TABS */}
      <div className="flex flex-wrap gap-2 border-b pb-6 mb-8 text-xs font-semibold tracking-wider" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
          { id: 'movies', label: 'MOVIE REGISTRY', icon: Film },
          { id: 'theaters', label: 'THEATERS', icon: MapPin },
          { id: 'showtimes', label: 'SHOW SCHEDULER', icon: Calendar },
          { id: 'bookings', label: 'BOOKINGS', icon: Ticket },
          { id: 'payments', label: 'AUDIT SLIPS', icon: Receipt },
          { id: 'users', label: 'USER LIST', icon: Users },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn flex items-center animate-transition"
              style={{
                backgroundColor: isActive ? 'var(--text)' : 'transparent',
                color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                borderColor: isActive ? 'var(--text)' : 'var(--border-mid)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              <tab.icon className="w-3.5 h-3.5 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE TABS */}
      {loading ? (
        <div className="py-20 text-center text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Accessing Database Registries...
        </div>
      ) : (
        <div className="bg-transparent">
          
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-8">
              
              {/* COUNTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6 flex flex-col justify-between h-32" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>TOTAL REVENUE</span>
                  <div className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>NRS {stats.stats.totalRevenue?.toLocaleString()}</div>
                  <span className="text-[9px] uppercase font-medium" style={{ color: 'var(--text-dim)' }}>CONFIRMED TRANSACTIONS</span>
                </div>
                
                <div className="card p-6 flex flex-col justify-between h-32" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>TICKET RESERVATIONS</span>
                  <div className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{stats.stats.totalBookings}</div>
                  <span className="text-[9px] uppercase font-medium" style={{ color: 'var(--text-dim)' }}>SEATS RESERVED</span>
                </div>

                <div className="card p-6 flex flex-col justify-between h-32" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>SECURE ACCOUNTS</span>
                  <div className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{stats.stats.totalUsers}</div>
                  <span className="text-[9px] uppercase font-medium" style={{ color: 'var(--text-dim)' }}>REGISTERED USERS</span>
                </div>

                <div className="card p-6 flex flex-col justify-between h-32" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>MOST BOOKED TITLE</span>
                  <div className="text-sm font-bold uppercase truncate max-w-[200px]" style={{ color: 'var(--text)' }} title={stats.stats.mostBookedMovie}>
                    {stats.stats.mostBookedMovie || 'N/A'}
                  </div>
                  <span className="text-[9px] uppercase font-medium" style={{ color: 'var(--text-dim)' }}>{stats.stats.mostBookedSeats || 0} SEATS OCCUPIED</span>
                </div>
              </div>

              {/* PAYMENT STATUS PIE BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-4" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                    KHALTI GATEWAY SLIPS
                  </h3>
                  <div className="space-y-3 text-xs font-medium uppercase">
                    <div className="flex justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>COMPLETED</span>
                      <span className="badge" style={{ color: '#4ade80', borderColor: '#166534', backgroundColor: 'rgba(22, 101, 52, 0.1)' }}>{stats.payments.completed}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>PENDING</span>
                      <span className="badge" style={{ color: '#fbbf24', borderColor: '#78350f', backgroundColor: 'rgba(120, 53, 15, 0.1)' }}>{stats.payments.pending}</span>
                    </div>
                    <div className="flex justify-between pb-1" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>FAILED</span>
                      <span className="badge" style={{ color: '#f87171', borderColor: '#3f1010', backgroundColor: 'rgba(63, 16, 16, 0.1)' }}>{stats.payments.failed}</span>
                    </div>
                  </div>
                </div>

                {/* RECENT BOOKINGS TABLE */}
                <div className="lg:col-span-2 card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-4" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                    LATEST LEDGER MODIFICATIONS
                  </h3>
                  
                  {stats.recentBookings.length === 0 ? (
                    <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      No active bookings in audit trace.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs tracking-wide">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                            <th className="py-2.5 font-semibold">ID</th>
                            <th className="py-2.5 font-semibold">USER</th>
                            <th className="py-2.5 font-semibold">FEATURE</th>
                            <th className="py-2.5 font-semibold">THEATER</th>
                            <th className="py-2.5 text-right font-semibold">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                          {stats.recentBookings.map(book => (
                            <tr key={book._id}>
                              <td className="py-3 font-semibold font-mono" style={{ color: 'var(--text)' }}>{book.bookingId}</td>
                              <td className="py-3 truncate max-w-[100px]">{book.user?.name}</td>
                              <td className="py-3 truncate max-w-[120px]" style={{ color: 'var(--text)' }}>{book.showtime?.movie?.title}</td>
                              <td className="py-3 truncate max-w-[120px]">{book.showtime?.theater?.name}</td>
                              <td className="py-3 text-right font-semibold font-mono" style={{ color: 'var(--text)' }}>NRS {book.totalAmount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MOVIE REGISTRY */}
          {activeTab === 'movies' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Add Movie */}
              <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6 flex items-center" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  REGISTER FEATURE FILM
                </h3>

                <form onSubmit={handleAddMovie} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="label">MOVIE TITLE</label>
                    <input
                      type="text" required placeholder="TITLE"
                      value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">GENRES (COMMA-SEPARATED)</label>
                    <input
                      type="text" required placeholder="SCI-FI, ACTION"
                      value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">LANGUAGE</label>
                      <input
                        type="text" required placeholder="ENGLISH"
                        value={movieForm.language} onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">RATING (1-10)</label>
                      <input
                        type="number" step="0.1" min="1" max="10" required
                        value={movieForm.rating} onChange={(e) => setMovieForm({ ...movieForm, rating: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">DURATION (MIN)</label>
                      <input
                        type="number" required
                        value={movieForm.duration} onChange={(e) => setMovieForm({ ...movieForm, duration: parseInt(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">RELEASE DATE</label>
                      <input
                        type="date" required
                        value={movieForm.releaseDate} onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">MINIMALIST POSTER FILE (OR DEFAULT AUTO)</label>
                    <input
                      type="file" accept="image/*" onChange={handlePosterUpload}
                      className="text-xs border p-2.5 cursor-pointer font-medium"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-mid)', color: 'var(--text)', borderRadius: '8px' }}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">SYNOPSIS DESCRIPTION</label>
                    <textarea
                      required placeholder="SYNOPSIS DETAILS..."
                      value={movieForm.description} onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                      className="input h-20 resize-none"
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full btn btn-primary py-3 text-xs tracking-wider uppercase cursor-pointer">
                    ADD TO CATALOG
                  </button>
                </form>
              </div>

              {/* Movie Grid Catalog */}
              <div className="lg:col-span-2 card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-4" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--text)' }}>
                    CATALOG INVENTORY
                  </h3>
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="field-icon w-4 h-4" />
                    <input
                      type="text"
                      placeholder="SEARCH CATALOG..."
                      value={movieSearch}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      className="input input-icon text-xs py-2"
                    />
                  </div>
                </div>

                {filteredMovies.length === 0 ? (
                  <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    No movies matching catalog search criteria.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {filteredMovies.map(movie => (
                      <div 
                        key={movie._id} 
                        className="card p-4 flex justify-between items-center gap-4 transition-all"
                        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                              {movie.title}
                            </h4>
                            <span className="badge text-[9px]" style={{
                              borderColor: movie.status === 'Running' ? 'rgba(74, 222, 128, 0.4)' : 'var(--border-mid)',
                              color: movie.status === 'Running' ? '#4ade80' : 'var(--text-muted)'
                            }}>
                              {movie.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] mt-1 uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            {movie.genre} &middot; {movie.duration} MIN &middot; {movie.language}
                          </p>
                        </div>

                        {/* Status changers */}
                        <div className="flex flex-wrap items-center gap-2">
                          {movie.status !== 'Running' && (
                            <button
                              onClick={() => handleToggleMovieStatus(movie._id, 'Running')}
                              className="btn btn-ghost px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase cursor-pointer"
                            >
                              RUNNING
                            </button>
                          )}
                          {movie.status !== 'Upcoming' && (
                            <button
                              onClick={() => handleToggleMovieStatus(movie._id, 'Upcoming')}
                              className="btn btn-ghost px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase cursor-pointer"
                            >
                              UPCOMING
                            </button>
                          )}
                          {movie.status !== 'Removed' && (
                            <button
                              onClick={() => handleToggleMovieStatus(movie._id, 'Removed')}
                              className="btn btn-ghost px-2.5 py-1.5 text-[9px] font-bold tracking-wider uppercase cursor-pointer"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                            >
                              REMOVE
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: THEATERS */}
          {activeTab === 'theaters' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Add Theater */}
              <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6 flex items-center" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  CONSTRUCT THEATER
                </h3>

                <form onSubmit={handleAddTheater} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="label">THEATER NAME</label>
                    <input
                      type="text" required placeholder="NAME"
                      value={theaterForm.name} onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">PHYSICAL ADDRESS</label>
                    <input
                      type="text" required placeholder="ADDRESS"
                      value={theaterForm.address} onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">LATITUDE</label>
                      <input
                        type="number" step="0.0001" required
                        value={theaterForm.latitude} onChange={(e) => setTheaterForm({ ...theaterForm, latitude: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">LONGITUDE</label>
                      <input
                        type="number" step="0.0001" required
                        value={theaterForm.longitude} onChange={(e) => setTheaterForm({ ...theaterForm, longitude: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">ROWS x COLS</label>
                    <div className="flex gap-2">
                      <input
                        type="number" placeholder="R" required
                        value={theaterForm.rows} onChange={(e) => setTheaterForm({ ...theaterForm, rows: parseInt(e.target.value) })}
                        className="input w-1/2"
                      />
                      <input
                        type="number" placeholder="C" required
                        value={theaterForm.cols} onChange={(e) => setTheaterForm({ ...theaterForm, cols: parseInt(e.target.value) })}
                        className="input w-1/2"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full btn btn-primary py-3 text-xs tracking-wider uppercase cursor-pointer">
                    ADD TO INFRASTRUCTURE
                  </button>
                </form>
              </div>

              {/* Theaters List */}
              <div className="lg:col-span-2 card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                  INFRASTRUCTURE SLOTS
                </h3>

                {theaters.length === 0 ? (
                  <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    No theaters constructured.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {theaters.map(theater => (
                      <div 
                        key={theater._id} 
                        className="card p-4 flex justify-between items-center gap-4"
                        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                      >
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                            {theater.name}
                          </h4>
                          <p className="text-[10px] mt-1 uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                            {theater.address} {theater.graphNode ? `· (${theater.graphNode})` : ''} &middot; Lat: {theater.location?.latitude}, Lng: {theater.location?.longitude}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge text-[10px] font-bold" style={{ borderColor: 'var(--border-mid)' }}>
                            {theater.rows}x{theater.cols} SEAT GRID
                          </span>
                          <button
                            onClick={() => handleDeleteTheater(theater._id)}
                            className="btn btn-ghost px-2.5 py-2 cursor-pointer transition-colors"
                            style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                            title="Delete theater"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: SHOW SCHEDULER */}
          {activeTab === 'showtimes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Form Add Showtime */}
              <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6 flex items-center" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  SCHEDULE SHOWTIME
                </h3>

                <form onSubmit={handleAddShowtime} className="space-y-4">
                  
                  <div className="flex flex-col space-y-1.5">
                    <label className="label">SELECT MOVIE</label>
                    <select
                      required
                      value={showtimeForm.movieId}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                      className="input cursor-pointer"
                    >
                      <option value="">-- CHOOSE TITLE --</option>
                      {movies.map(m => (
                        <option key={m._id} value={m._id}>{m.title.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">SELECT CINEMA</label>
                    <select
                      required
                      value={showtimeForm.theaterId}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, theaterId: e.target.value })}
                      className="input cursor-pointer"
                    >
                      <option value="">-- CHOOSE CINEMA --</option>
                      {theaters.map(t => (
                        <option key={t._id} value={t._id}>{t.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="label">DATE &amp; TIME</label>
                    <input
                      type="datetime-local" required
                      value={showtimeForm.dateTime} onChange={(e) => setShowtimeForm({ ...showtimeForm, dateTime: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">BASE PRICE (NRS)</label>
                      <input
                        type="number" required min="100" max="2000"
                        value={showtimeForm.basePrice} onChange={(e) => setShowtimeForm({ ...showtimeForm, basePrice: parseInt(e.target.value) })}
                        className="input"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="label">POP MULTIPLIER</label>
                      <input
                        type="number" step="0.05" required min="0.5" max="3"
                        value={showtimeForm.popularityMultiplier} onChange={(e) => setShowtimeForm({ ...showtimeForm, popularityMultiplier: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full btn btn-primary py-3 text-xs tracking-wider uppercase cursor-pointer">
                    SCHEDULE SHOW
                  </button>
                </form>
              </div>

              {/* Showtimes Inventory List */}
              <div className="lg:col-span-2 card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                  SLOTS LISTINGS
                </h3>

                {showtimes.length === 0 ? (
                  <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    No active slots scheduled.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
                    {showtimes.map(show => (
                      <div 
                        key={show._id} 
                        className="card p-4 flex justify-between items-center gap-4"
                        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
                      >
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                            {show.movie?.title}
                          </h4>
                          <p className="text-[10px] mt-1 uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                            {show.theater?.name} &middot; NRS {show.basePrice} (Multiplier: {show.popularityMultiplier})
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            {new Date(show.dateTime).toLocaleDateString()} at {new Date(show.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteShowtime(show._id)}
                          className="btn btn-ghost px-2.5 py-2 cursor-pointer transition-colors"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                          title="Delete showtime"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5b: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                ALL BOOKINGS — LIVE STATUS
              </h3>

              {bookings.length === 0 ? (
                <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  No bookings in the system.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tracking-wide">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        <th className="py-3 font-semibold">BOOKING ID</th>
                        <th className="py-3 font-semibold">USER</th>
                        <th className="py-3 font-semibold">MOVIE</th>
                        <th className="py-3 font-semibold">SEATS</th>
                        <th className="py-3 font-semibold">STATUS</th>
                        <th className="py-3 font-semibold">EXPIRY TIMER</th>
                        <th className="py-3 text-right font-semibold">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {bookings.map(b => {
                        const isPending = b.status === 'Pending';
                        const hasExpiry = isPending && b.expiresAt;
                        return (
                          <tr key={b._id} style={isPending ? { backgroundColor: 'rgba(234,179,8,0.03)' } : {}}>
                            <td className="py-3.5 font-mono font-bold select-all" style={{ color: 'var(--text)' }}>#{b.bookingId}</td>
                            <td className="py-3.5 truncate max-w-[130px]">{b.user?.name}<br /><span className="text-[9px]">{b.user?.email}</span></td>
                            <td className="py-3.5 truncate max-w-[120px]" style={{ color: 'var(--text)' }}>{b.showtime?.movie?.title}</td>
                            <td className="py-3.5">{b.seatNumbers?.join(', ')}</td>
                            <td className="py-3.5">
                              <span className="badge text-[9px]" style={{
                                borderColor: b.status === 'Confirmed' ? 'rgba(74,222,128,0.4)'
                                  : b.status === 'Pending' ? 'rgba(234,179,8,0.4)'
                                  : 'rgba(239,68,68,0.4)',
                                color: b.status === 'Confirmed' ? '#4ade80'
                                  : b.status === 'Pending' ? '#eab308'
                                  : '#f87171'
                              }}>
                                {b.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5">
                              {hasExpiry
                                ? <ExpiryCountdown expiresAt={b.expiresAt} />
                                : <span style={{ color: 'var(--text-dim)' }}>—</span>
                              }
                            </td>
                            <td className="py-3.5 text-right font-mono font-bold" style={{ color: 'var(--text)' }}>NRS {b.totalAmount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT SLIPS */}
          {activeTab === 'payments' && (
            <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold tracking-wider uppercase border-b pb-3 mb-6" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
                PAYMENT AUDIT LEDGER
              </h3>

              {payments.length === 0 ? (
                <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  No transaction ledgers logged.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tracking-wide">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        <th className="py-3 font-semibold">PIDX ID</th>
                        <th className="py-3 font-semibold">USER EMAIL</th>
                        <th className="py-3 font-semibold">FEATURE FILM</th>
                        <th className="py-3 font-semibold">TRANSACTION CODE</th>
                        <th className="py-3 font-semibold">STATUS</th>
                        <th className="py-3 text-right font-semibold">TOTAL PAID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {payments.map(pay => (
                        <tr key={pay._id}>
                          <td className="py-3.5 font-mono truncate max-w-[100px] select-all">{pay.pidx}</td>
                          <td className="py-3.5 truncate max-w-[120px]">{pay.booking?.user?.email}</td>
                          <td className="py-3.5 truncate max-w-[120px]" style={{ color: 'var(--text)' }}>{pay.booking?.showtime?.movie?.title}</td>
                          <td className="py-3.5 font-mono select-all">{pay.transactionId || 'SANDBOX_TEST'}</td>
                          <td className="py-3.5">
                            <span className="badge text-[9px]" style={{
                              borderColor: pay.status === 'Completed' ? 'rgba(74, 222, 128, 0.4)' : 'var(--border-mid)',
                              color: pay.status === 'Completed' ? '#4ade80' : 'var(--text-muted)'
                            }}>
                              {pay.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold" style={{ color: 'var(--text)' }}>NRS {pay.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: USER LIST */}
          {activeTab === 'users' && (
            <div className="card p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-4" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--text)' }}>
                  USER CONTROL LIST
                </h3>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="field-icon w-4 h-4" />
                  <input
                    type="text"
                    placeholder="SEARCH USERS..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input input-icon text-xs py-2"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-xs py-10 text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  No standard user accounts matching search criteria.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs tracking-wide">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        <th className="py-3 font-semibold">NAME</th>
                        <th className="py-3 font-semibold">EMAIL ADDRESS</th>
                        <th className="py-3 font-semibold">ACCOUNT STATUS</th>
                        <th className="py-3 font-semibold">REGISTRATION DATE</th>
                        <th className="py-3 text-right font-semibold">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {filteredUsers.map(u => (
                        <tr key={u._id}>
                          <td className="py-3.5 font-bold" style={{ color: 'var(--text)' }}>{u.name}</td>
                          <td className="py-3.5 select-all">{u.email}</td>
                          <td className="py-3.5">
                            <span className="badge text-[9px]" style={{
                              borderColor: u.status === 'active' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                              color: u.status === 'active' ? '#4ade80' : '#f87171'
                            }}>
                              {u.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleToggleBlock(u._id)}
                              className="btn btn-ghost px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                              style={{
                                borderColor: u.status === 'active' ? 'var(--border-mid)' : 'var(--text)',
                                color: u.status === 'active' ? 'var(--text-muted)' : 'var(--text)',
                                backgroundColor: u.status === 'active' ? 'transparent' : 'var(--accent)'
                              }}
                            >
                              {u.status === 'active' ? 'BLOCK USER' : 'UNBLOCK USER'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
export default AdminDashboard;
