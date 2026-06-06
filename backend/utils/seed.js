const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

dotenv.config();

// Minimalist black-and-white SVG posters encoded in Base64
const POSTERS = {
  dune: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" style="background:%23000;"><circle cx="150" cy="200" r="80" stroke="%23fff" stroke-width="2" fill="none" opacity="0.3"/><circle cx="140" cy="200" r="78" fill="%23000"/><text x="150" y="360" fill="%23fff" font-family="Courier, monospace" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="4">D U N E</text><text x="150" y="390" fill="%23888" font-family="Courier, monospace" font-size="12" text-anchor="middle" letter-spacing="2">PART TWO</text></svg>',
  oppenheimer: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" style="background:%23000;"><line x1="150" y1="50" x2="150" y2="300" stroke="%23fff" stroke-width="1" opacity="0.5"/><circle cx="150" cy="200" r="10" fill="%23fff"/><circle cx="150" cy="200" r="30" stroke="%23fff" stroke-width="1" stroke-dasharray="4" fill="none"/><circle cx="150" cy="200" r="60" stroke="%23fff" stroke-width="1" fill="none" opacity="0.7"/><text x="150" y="360" fill="%23fff" font-family="Courier, monospace" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="4">OPPENHEIMER</text><text x="150" y="390" fill="%23888" font-family="Courier, monospace" font-size="12" text-anchor="middle" letter-spacing="2">THE WORLD FOREVER CHANGES</text></svg>',
  spiderman: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" style="background:%23000;"><path d="M150,50 L150,300 M50,200 L250,200 M79,129 L221,271 M79,271 L221,129" stroke="%23fff" stroke-width="1" opacity="0.3"/><path d="M150,120 C120,150 120,250 150,280 C180,250 180,150 150,120" stroke="%23fff" stroke-width="1.5" fill="none"/><circle cx="150" cy="200" r="40" stroke="%23fff" stroke-width="1" fill="none"/><text x="150" y="360" fill="%23fff" font-family="Courier, monospace" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="2">SPIDER-MAN</text><text x="150" y="395" fill="%23888" font-family="Courier, monospace" font-size="11" text-anchor="middle" letter-spacing="1">BEYOND THE SPIDER-VERSE</text></svg>',
  interstellar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" style="background:%23000;"><ellipse cx="150" cy="200" rx="100" ry="20" fill="none" stroke="%23fff" stroke-width="2" transform="rotate(-15 150 200)"/><circle cx="150" cy="200" r="30" fill="%23000" stroke="%23fff" stroke-width="1"/><text x="150" y="360" fill="%23fff" font-family="Courier, monospace" font-size="18" font-weight="bold" text-anchor="middle" letter-spacing="4">INTERSTELLAR</text><text x="150" y="390" fill="%23888" font-family="Courier, monospace" font-size="11" text-anchor="middle" letter-spacing="2">MANKIND WAS BORN ON EARTH</text></svg>',
  darkknight: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450" style="background:%23000;"><path d="M150,150 C130,130 90,130 90,170 C90,210 130,230 150,250 C170,230 210,210 210,170 C210,130 170,130 150,150 Z" stroke="%23fff" stroke-width="1.5" fill="none" transform="rotate(45 150 200)"/><text x="150" y="360" fill="%23fff" font-family="Courier, monospace" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="3">DARK KNIGHT</text><text x="150" y="390" fill="%23888" font-family="Courier, monospace" font-size="12" text-anchor="middle" letter-spacing="2">WHY SO SERIOUS?</text></svg>'
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moviesmania');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Movie.deleteMany();
    await Theater.deleteMany();
    await Showtime.deleteMany();
    await Seat.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();

    console.log('Database cleared.');

    // 1. Create Users (5 total: 1 admin + 4 regular)
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    });

    await User.create({
      name: 'ujwal paudel',
      email: 'ujwalpaudel@gmail.com',
      password: 'ujwal',
      role: 'user',
      status: 'active'
    });

    await User.create({
      name: 'Sara Khan',
      email: 'sara@example.com',
      password: 'password123',
      role: 'user',
      status: 'active'
    });

    await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      password: 'password123',
      role: 'user',
      status: 'active'
    });

    await User.create({
      name: 'Emily Chen',
      email: 'emily@example.com',
      password: 'password123',
      role: 'user',
      status: 'active'
    });

    console.log('Seeded 5 users (1 admin + 4 regular).');

    // 2. Create Theaters (with matching graph nodes and real Kathmandu Valley locations)
    const theaters = await Theater.insertMany([
      // ── Original 5 ──
      {
        name: 'QFX Cinema - Chabahil',
        address: 'Chabahil, Kathmandu',
        location: { latitude: 27.7280, longitude: 85.3350 },
        graphNode: 'Node_A',
        rows: 8,
        cols: 10
      },
      {
        name: 'One Cinema - Gaushala',
        address: 'Gaushala, Kathmandu',
        location: { latitude: 27.7150, longitude: 85.3400 },
        graphNode: 'Node_B',
        rows: 8,
        cols: 10
      },
      {
        name: 'Big Movies - Lagankhel',
        address: 'Lagankhel, Lalitpur',
        location: { latitude: 27.6620, longitude: 85.3250 },
        graphNode: 'Node_C',
        rows: 6,
        cols: 8
      },
      {
        name: 'FCube Cinemas - Gwarko',
        address: 'Gwarko, Lalitpur',
        location: { latitude: 27.6800, longitude: 85.3450 },
        graphNode: 'Node_E',
        rows: 8,
        cols: 8
      },
      {
        name: 'Koteshwor Cineplex',
        address: 'Koteshwor, Kathmandu',
        location: { latitude: 27.7050, longitude: 85.3500 },
        graphNode: 'Node_D',
        rows: 8,
        cols: 10
      },
      // ── 5 New Theaters ──
      {
        name: 'Heritage Cinema - Bhaktapur',
        address: 'Suryabinayak, Bhaktapur',
        location: { latitude: 27.6710, longitude: 85.4298 },
        graphNode: 'Node_F',
        rows: 7,
        cols: 9
      },
      {
        name: 'Westgate Cinemas - Kalanki',
        address: 'Kalanki Chowk, Kathmandu',
        location: { latitude: 27.6960, longitude: 85.2830 },
        graphNode: 'Node_G',
        rows: 8,
        cols: 10
      },
      {
        name: 'Satdobato Multiplex',
        address: 'Satdobato, Lalitpur',
        location: { latitude: 27.6520, longitude: 85.3390 },
        graphNode: 'Node_H',
        rows: 6,
        cols: 9
      },
      {
        name: 'QFX Cinema - Suryabinayak',
        address: 'Suryabinayak Road, Bhaktapur',
        location: { latitude: 27.6710, longitude: 85.4298 },
        graphNode: 'Node_I',
        rows: 8,
        cols: 12
      },
      {
        name: 'Swayambhu CineHub',
        address: 'Swayambhu, Kathmandu',
        location: { latitude: 27.7020, longitude: 85.2940 },
        graphNode: 'Node_J',
        rows: 7,
        cols: 8
      }
    ]);

    console.log('Seeded 10 theaters across expanded Kathmandu Valley road graph.');

    // 3. Create Movies
    const movies = await Movie.insertMany([
      {
        title: 'Dune: Part Two',
        genre: 'Sci-Fi, Action, Adventure',
        language: 'English',
        rating: 9.0,
        poster: POSTERS.dune,
        status: 'Running',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        duration: 166,
        releaseDate: new Date('2024-03-01')
      },
      {
        title: 'Oppenheimer',
        genre: 'Biography, Drama, History',
        language: 'English',
        rating: 8.9,
        poster: POSTERS.oppenheimer,
        status: 'Running',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        duration: 180,
        releaseDate: new Date('2023-07-21')
      },
      {
        title: 'Spider-Man: Beyond the Spider-Verse',
        genre: 'Animation, Action, Sci-Fi',
        language: 'English',
        rating: 9.2,
        poster: POSTERS.spiderman,
        status: 'Upcoming',
        description: 'The spectacular continuation of the Spider-Verse saga, following Miles Morales across alternate dimensions.',
        duration: 140,
        releaseDate: new Date('2026-12-18')
      },
      {
        title: 'Interstellar',
        genre: 'Sci-Fi, Drama, Adventure',
        language: 'English',
        rating: 8.7,
        poster: POSTERS.interstellar,
        status: 'Running',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        duration: 169,
        releaseDate: new Date('2014-11-07')
      },
      {
        title: 'The Dark Knight',
        genre: 'Action, Crime, Drama',
        language: 'English',
        rating: 9.0,
        poster: POSTERS.darkknight,
        status: 'Running',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        duration: 152,
        releaseDate: new Date('2008-07-18')
      }
    ]);

    console.log('Seeded 5 movies (Running/Upcoming).');

    // 4. Create Showtimes
    const runningMovies = movies.filter(m => m.status === 'Running');
    const showtimesData = [];

    // Create showtimes for today, tomorrow, and day after tomorrow
    const dates = [
      new Date(),
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    ];

    // Show hours: 10:00 (morning), 14:00 (afternoon), 18:00 (evening peak), 21:00 (night peak)
    const hours = [10, 14, 18, 21];

    runningMovies.forEach((movie, mIdx) => {
      // Alternate theaters to distribute showtimes
      theaters.forEach((theater, tIdx) => {
        if ((mIdx + tIdx) % 2 === 0) {
          dates.forEach((date, dIdx) => {
            hours.forEach(hour => {
              const showTime = new Date(date);
              showTime.setHours(hour, 0, 0, 0);

              // Set popularity multiplier higher for evening shows (18:00 and 21:00)
              const popularityMultiplier = hour >= 17 ? 1.15 : 1.0;

              showtimesData.push({
                movie: movie._id,
                theater: theater._id,
                dateTime: showTime,
                basePrice: 350 + (mIdx * 50), // NRS 350 to 500
                popularityMultiplier
              });
            });
          });
        }
      });
    });

    const seededShowtimes = await Showtime.insertMany(showtimesData);
    console.log(`Seeded ${seededShowtimes.length} showtimes with diverse dates, hours, and popularity factors.`);

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
