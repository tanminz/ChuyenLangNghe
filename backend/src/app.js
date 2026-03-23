const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const { MONGODB_URI, DB_NAME, SESSION_SECRET, NODE_ENV, CORS_ORIGINS } = require('./config/env');

const productsRoutes = require('./routes/products.routes');
const usersRoutes = require('./routes/users.routes');
const cartRoutes = require('./routes/cart.routes');
const ordersRoutes = require('./routes/orders.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const blogsRoutes = require('./routes/blogs.routes');
const couponsRoutes = require('./routes/coupons.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(morgan('combined'));
const allowedOrigins = new Set(CORS_ORIGINS);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    dbName: DB_NAME,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve uploaded images (product images, etc.) – thư mục trùng với nơi routes + migrate ghi file
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use('/products', productsRoutes);
app.use('/user', usersRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/blogs', blogsRoutes);
app.use('/coupons', couponsRoutes);
app.use('/ai', aiRoutes);

app.use((err, _req, res, next) => {
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  return next(err);
});

module.exports = app;
