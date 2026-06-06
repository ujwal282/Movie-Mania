/**
 * Resolves a movie poster URL.
 * If it is a relative path starting with /uploads/, it prepends the backend API URL.
 * Otherwise, it returns the poster path as is (for base64 or external links).
 */
export const resolvePoster = (posterPath) => {
  if (!posterPath) return '';
  
  if (posterPath.startsWith('/uploads/')) {
    const backendUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    // Remove duplicate slashes if any
    return `${backendUrl.replace(/\/$/, '')}${posterPath}`;
  }
  
  return posterPath;
};
