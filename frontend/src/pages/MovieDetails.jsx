import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Star, Clock, Calendar, LocateFixed, AlertCircle, ChevronDown } from 'lucide-react';
import { resolvePoster } from '../utils/resolvePoster';

// Static fallback locations
const STATIC_LOCATIONS = [
  { label: 'My GPS Location',                     latitude: null,    longitude: null,   node: 'gps' },
  { label: '✍ Enter Custom Coordinates',          latitude: 27.7007, longitude: 85.3123, node: 'custom' },
  { label: 'New Road (Kathmandu Center)',          latitude: 27.7007, longitude: 85.3123, node: 'User_Center' },
  { label: 'Balaju (Kathmandu North)',             latitude: 27.7172, longitude: 85.3240, node: 'User_North' },
  { label: 'Jawalakhel (Lalitpur South)',          latitude: 27.6710, longitude: 85.3215, node: 'User_South' },
  { label: 'Thimi / Bhaktapur Area (East)',        latitude: 27.6970, longitude: 85.3680, node: 'User_East' },
  { label: 'Kalanki (West Kathmandu)',             latitude: 27.6990, longitude: 85.2860, node: 'User_West' },
];

const FALLBACK = { latitude: 27.7007, longitude: 85.3123 };

export const MovieDetails = () => {
  const { id } = useParams();
  const { api } = useAuth();

  const [movie, setMovie] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  // Location state
  const [selectedLocationKey, setSelectedLocationKey] = useState('gps');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | requesting | granted | denied | error
  const [activeCoords, setActiveCoords] = useState(null); // coords actually used for distance calculation

  const [customLat, setCustomLat] = useState('27.7007');
  const [customLng, setCustomLng] = useState('85.3123');

  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingTheaters, setLoadingTheaters] = useState(false);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // 1. Fetch movie
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoadingMovie(true);
        const res = await api.get(`/api/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        console.error('Error fetching movie:', err);
      } finally {
        setLoadingMovie(false);
      }
    };
    fetchMovie();
  }, [id]);

  // 2. Request GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGpsCoords(coords);
        setGeoStatus('granted');
        // Auto-set active coords only if user hasn't already switched to a static location
        setActiveCoords(coords);
      },
      (err) => {
        console.warn('Geolocation denied:', err.message);
        setGeoStatus('denied');
        // Fall back to city center
        setActiveCoords(FALLBACK);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // 3. When user picks a location from dropdown, update activeCoords
  const handleLocationChange = (key) => {
    setSelectedLocationKey(key);
    if (key === 'gps') {
      setActiveCoords(gpsCoords || FALLBACK);
    } else if (key === 'custom') {
      const latVal = parseFloat(customLat);
      const lngVal = parseFloat(customLng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        setActiveCoords({ latitude: latVal, longitude: lngVal });
      }
    } else {
      const loc = STATIC_LOCATIONS.find(l => l.node === key);
      if (loc) setActiveCoords({ latitude: loc.latitude, longitude: loc.longitude });
    }
  };

  // 4. Fetch nearest theaters when activeCoords change
  useEffect(() => {
    if (!activeCoords) return;
    const fetchTheaters = async () => {
      try {
        setLoadingTheaters(true);
        const res = await api.get(
          `/api/theaters/nearest?latitude=${activeCoords.latitude}&longitude=${activeCoords.longitude}`
        );
        setTheaters(res.data);
        if (res.data.length > 0) setSelectedTheater(res.data[0]);
      } catch (err) {
        console.error('Theater recommendation error:', err);
      } finally {
        setLoadingTheaters(false);
      }
    };
    fetchTheaters();
  }, [activeCoords]);

  // 5. Fetch showtimes when theater changes
  useEffect(() => {
    if (!selectedTheater) return;
    const fetchShowtimes = async () => {
      try {
        setLoadingShowtimes(true);
        const res = await api.get(`/api/showtimes?movie=${id}&theater=${selectedTheater._id}`);
        setShowtimes(res.data);
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoadingShowtimes(false);
      }
    };
    fetchShowtimes();
  }, [id, selectedTheater]);

  // Group showtimes by date
  const groupedShowtimes = showtimes.reduce((groups, show) => {
    const dateStr = new Date(show.dateTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(show);
    return groups;
  }, {});

  // Active label for dropdown
  const activeLabel = () => {
    if (selectedLocationKey === 'gps') {
      if (geoStatus === 'granted') return 'Your GPS Location';
      if (geoStatus === 'requesting') return 'Detecting GPS…';
      return 'GPS Unavailable (using city center)';
    }
    return STATIC_LOCATIONS.find(l => l.node === selectedLocationKey)?.label || '';
  };

  if (loadingMovie) return (
    <div className="min-h-screen flex items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
      <div className="w-5 h-5 border-2 rounded-full animate-spin"
           style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text)' }} />
      <span className="text-sm">Loading movie…</span>
    </div>
  );

  if (!movie) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      <p className="text-sm">Movie not found.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 min-h-screen">

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← Back to movies
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT: Poster + meta */}
        <div className="lg:col-span-4">
          <div className="w-full max-w-xs rounded-xl overflow-hidden mb-6"
               style={{ border: '1px solid var(--border)', aspectRatio: '2/3' }}>
            <img src={resolvePoster(movie.poster)} alt={movie.title} className="w-full h-full object-cover" />
          </div>
          <div className="rounded-xl p-4 space-y-1"
               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {[
              { label: 'Rating', value: `⭐ ${movie.rating.toFixed(1)} / 10` },
              { label: 'Duration', value: `${movie.duration} min` },
              { label: 'Language', value: movie.language },
              { label: 'Genre', value: movie.genre },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-sm py-2.5"
                   style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-8 space-y-7">

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
              {movie.title}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {movie.description}
            </p>
          </div>

          {/* Nearest Theaters */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>

            {/* Panel header with location selector */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                 style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Nearest Theaters</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Sorted by nearest distance
                  </p>
                </div>
              </div>

              {/* Location dropdown */}
              <div className="flex items-center gap-2">
                {/* GPS status dot */}
                <div className="w-2 h-2 rounded-full shrink-0"
                     style={{
                       backgroundColor: geoStatus === 'granted'
                         ? '#22c55e'
                         : geoStatus === 'requesting'
                         ? '#eab308'
                         : 'var(--text-dim)',
                     }} />
                <div className="relative">
                  <select
                    value={selectedLocationKey}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="input"
                    style={{
                      paddingTop: '0.4rem',
                      paddingBottom: '0.4rem',
                      paddingRight: '2rem',
                      fontSize: '0.8125rem',
                      minWidth: '220px',
                      appearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {STATIC_LOCATIONS.map(loc => (
                      <option key={loc.node} value={loc.node}
                              disabled={loc.node === 'gps' && geoStatus === 'denied'}>
                        {loc.node === 'gps'
                          ? geoStatus === 'granted'
                            ? '📍 My GPS Location'
                            : geoStatus === 'requesting'
                            ? '⏳ Detecting GPS…'
                            : '⚠ GPS Unavailable'
                          : loc.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                               style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            {/* GPS status bar */}
            {geoStatus === 'denied' && selectedLocationKey === 'gps' && (
              <div className="px-5 py-2.5 flex items-center gap-2 text-xs"
                   style={{ backgroundColor: 'rgba(234,179,8,0.06)', borderBottom: '1px solid rgba(234,179,8,0.2)', color: '#eab308' }}>
                <AlertCircle size={13} />
                Location access denied — select a presets location or select 'Enter Custom Coordinates' from the dropdown.
              </div>
            )}

            {/* Custom Coordinates input fields */}
            {selectedLocationKey === 'custom' && (
              <div className="px-5 py-3 flex flex-wrap items-center gap-4 text-xs"
                   style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>LATITUDE:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => {
                      setCustomLat(e.target.value);
                      const latVal = parseFloat(e.target.value);
                      const lngVal = parseFloat(customLng);
                      if (!isNaN(latVal) && !isNaN(lngVal)) {
                        setActiveCoords({ latitude: latVal, longitude: lngVal });
                      }
                    }}
                    className="input py-1 px-2 text-xs w-24"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-mid)', color: 'var(--text)' }}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>LONGITUDE:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => {
                      setCustomLng(e.target.value);
                      const latVal = parseFloat(customLat);
                      const lngVal = parseFloat(e.target.value);
                      if (!isNaN(latVal) && !isNaN(lngVal)) {
                        setActiveCoords({ latitude: latVal, longitude: lngVal });
                      }
                    }}
                    className="input py-1 px-2 text-xs w-24"
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border-mid)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            )}

            {/* Theater list */}
            {loadingTheaters || !activeCoords ? (
              <div className="flex items-center gap-3 px-5 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                     style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text-muted)' }} />
                Calculating nearest theaters…
              </div>
            ) : (
              theaters.map((theater, idx) => {
                const isSelected = selectedTheater?._id === theater._id;
                return (
                  <div
                    key={theater._id}
                    onClick={() => setSelectedTheater(theater)}
                    className="px-5 py-4 flex justify-between items-start gap-4 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-subtle)' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? 'var(--text)' : 'transparent'}`,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                          {theater.name}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}>
                            Nearest
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        {theater.address} {theater.graphNode ? `· ${theater.graphNode}` : ''}
                      </p>
                      {theater.path?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap text-[11px]"
                             style={{ color: 'var(--text-dim)' }}>
                          <Navigation size={10} />
                          {theater.path.map((node, nIdx) => (
                            <span key={node} className="flex items-center gap-1">
                              <span style={{ color: node.startsWith('User_') ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                                {node}
                              </span>
                              {nIdx < theater.path.length - 1 && <span>→</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                        {theater.distance} km
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>distance</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Showtimes */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="px-5 py-4 flex items-center gap-2"
                 style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  Showtimes at {selectedTheater?.name}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Select a slot to view dynamic seat pricing
                </p>
              </div>
            </div>

            {loadingShowtimes ? (
              <div className="flex items-center gap-3 px-5 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                     style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text-muted)' }} />
                Loading showtimes…
              </div>
            ) : showtimes.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No showtimes scheduled for this theater.
              </div>
            ) : (
              <div className="px-5 py-5 space-y-6">
                {Object.keys(groupedShowtimes).map(dateStr => (
                  <div key={dateStr}>
                    <h4 className="text-xs font-semibold mb-3"
                        style={{ color: 'var(--text-muted)', borderLeft: '2px solid var(--text)', paddingLeft: '0.5rem' }}>
                      {dateStr}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {groupedShowtimes[dateStr].map(show => {
                        const timeStr = new Date(show.dateTime).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit',
                        });
                        const isPeak = new Date(show.dateTime).getHours() >= 17;
                        return (
                          <Link
                            key={show._id}
                            to={`/showtimes/${show._id}`}
                            className="flex flex-col items-center px-4 py-2.5 rounded-lg border text-sm font-medium transition-all"
                            style={{
                              borderColor: 'var(--border-mid)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text)',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = 'var(--text)';
                              e.currentTarget.style.color = 'var(--bg)';
                              e.currentTarget.style.borderColor = 'var(--text)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                              e.currentTarget.style.color = 'var(--text)';
                              e.currentTarget.style.borderColor = 'var(--border-mid)';
                            }}
                          >
                            <span className="font-semibold">{timeStr}</span>
                            <span className="text-[11px] mt-0.5" style={{ color: 'inherit', opacity: 0.65 }}>
                              NRS {show.basePrice}{isPeak ? ' · Peak' : ''}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
export default MovieDetails;
