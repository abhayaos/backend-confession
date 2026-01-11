const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Load environment variables
    require('dotenv').config();
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI is not defined in .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit if DB connection fails
  }
};

module.exports = connectDB;