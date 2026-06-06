// Dynamic coordinate-based pathfinding utility
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Extracts coordinates from a theater object, supporting both nested and flat structures.
 * Supports theater.location.latitude/longitude and theater.latitude/theater.longitude.
 */
const getTheaterCoordinates = (theater) => {
  if (theater.location && theater.location.latitude !== undefined && theater.location.longitude !== undefined) {
    return {
      latitude: theater.location.latitude,
      longitude: theater.location.longitude,
    };
  }
  return {
    latitude: theater.latitude,
    longitude: theater.longitude,
  };
};

/**
 * Finds and sorts theaters by shortest direct distance from user coordinates.
 */
const getNearestTheaters = (userLat, userLng, theaters) => {
  if (!userLat || !userLng || !theaters || theaters.length === 0) {
    return (theaters || []).map((t) => {
      const tObj = typeof t.toObject === 'function' ? t.toObject() : t;
      return { ...tObj, distance: 0 };
    });
  }

  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);

  return theaters
    .map((theater) => {
      const theaterObj = typeof theater.toObject === 'function' ? theater.toObject() : theater;
      const coords = getTheaterCoordinates(theater);
      
      let distance = null;
      if (coords.latitude !== undefined && coords.longitude !== undefined) {
        const rawDistance = getDistance(lat, lng, parseFloat(coords.latitude), parseFloat(coords.longitude));
        distance = parseFloat(rawDistance.toFixed(2));
      }

      return {
        ...theaterObj,
        distance,
      };
    })
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
};

module.exports = {
  getNearestTheaters,
};
