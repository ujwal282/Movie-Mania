import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Film, Star, Clock } from 'lucide-react';
import { resolvePoster } from '../utils/resolvePoster';

export const Home = () => {
  const { api } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, [search, selectedGenre]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      let url = '/api/movies?status=Running';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedGenre) url += `&genre=${encodeURIComponent(selectedGenre)}`;
      const response = await api.get(url);
      setMovies(response.data);
      if (genres.length === 0 && response.data.length > 0) {
        const allGenres = new Set();
        response.data.forEach(m => m.genre.split(',').forEach(g => allGenres.add(g.trim())));
        setGenres(Array.from(allGenres));
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 min-h-screen">

      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--text)' }}>
          Now Showing
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Browse running films — select one to find the nearest theater via real-time routing.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="field-icon" />
          <input
            type="text"
            placeholder="Search movies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-icon"
          />
        </div>

        {/* Genre pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGenre('')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer"
            style={{
              backgroundColor: selectedGenre === '' ? 'var(--text)' : 'transparent',
              color: selectedGenre === '' ? 'var(--bg)' : 'var(--text-muted)',
              borderColor: selectedGenre === '' ? 'var(--text)' : 'var(--border-mid)',
            }}
          >
            All
          </button>
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer"
              style={{
                backgroundColor: selectedGenre === genre ? 'var(--text)' : 'transparent',
                color: selectedGenre === genre ? 'var(--bg)' : 'var(--text-muted)',
                borderColor: selectedGenre === genre ? 'var(--text)' : 'var(--border-mid)',
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: 'var(--text-muted)' }}>
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
               style={{ borderColor: 'var(--border-mid)', borderTopColor: 'var(--text)' }} />
          <span className="text-sm">Loading movies…</span>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-24 text-center rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <Film size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No movies match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {movies.map(movie => (
            <div
              key={movie._id}
              className="card group flex flex-col cursor-pointer"
              style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Poster */}
              <div className="aspect-[2/3] overflow-hidden relative" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                {movie.poster ? (
                  <img
                    src={resolvePoster(movie.poster)}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                       style={{ color: 'var(--text-dim)' }}>
                    <Film size={28} />
                    <span className="text-xs">No poster</span>
                  </div>
                )}
                {/* Language badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                     style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                  {movie.language}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
                    {movie.title}
                  </h2>
                  <div className="flex items-center gap-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    <Star size={11} className="fill-current" />
                    <span className="text-xs font-medium">{movie.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{movie.genre}</p>

                <p className="text-xs leading-relaxed line-clamp-2 mb-4 flex-1" style={{ color: 'var(--text-dim)' }}>
                  {movie.description}
                </p>

                <div className="flex items-center justify-between pt-3"
                     style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} />
                    <span>{movie.duration} min</span>
                  </div>
                  <Link
                    to={`/movies/${movie._id}`}
                    className="btn btn-primary"
                    style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem', textDecoration: 'none' }}
                  >
                    Book
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Home;
