require('dotenv').config();

function cleanEnv(value, fallback = '') {
  const raw = value == null ? fallback : value;
  return String(raw).trim();
}

function parseCorsOrigins(value) {
  if (!value) return ['http://localhost:4200'];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = {
  PORT: Number(cleanEnv(process.env.PORT, 3002)),
  MONGODB_URI: cleanEnv(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017'),
  DB_NAME: cleanEnv(process.env.DB_NAME, 'chuyenlangnghe'),
  SESSION_SECRET: cleanEnv(process.env.SESSION_SECRET, 'secret'),
  NODE_ENV: cleanEnv(process.env.NODE_ENV, 'development'),
  CORS_ORIGINS: parseCorsOrigins(cleanEnv(process.env.CORS_ORIGIN, 'http://localhost:4200')),
  GEMINI_API_KEY: cleanEnv(process.env.GEMINI_API_KEY, ''),
  GEMINI_MODEL: cleanEnv(process.env.GEMINI_MODEL, 'gemini-1.5-flash'),
  GEMINI_API_BASE_URL: cleanEnv(process.env.GEMINI_API_BASE_URL, 'https://generativelanguage.googleapis.com/v1beta')
};
