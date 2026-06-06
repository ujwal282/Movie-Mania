const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moviesmania');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop the obsolete unique index on graphNode if it exists
    try {
      await conn.connection.db.collection('theaters').dropIndex('graphNode_1');
      console.log('Obsolete unique graphNode index dropped successfully.');
    } catch (indexError) {
      // The index might not exist or has already been dropped
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
