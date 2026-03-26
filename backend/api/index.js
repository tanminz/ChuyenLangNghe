const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');

let dbReadyPromise = null;

async function ensureDatabaseConnection() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDatabase();
  }
  return dbReadyPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : String(error?.message || error)
    });
  }
};
