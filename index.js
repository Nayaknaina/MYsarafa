const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/group');
const kycRoutes = require('./routes/kyc');
const membershipRoute = require('./routes/membership');
const announcementsRoute = require('./routes/announcements')
const superAdminRoutes = require('./routes/superAdmin');
const ratesRoutes = require('./routes/rates');
const businessRoutes = require('./routes/businesses');  
const ledgerRoutes = require('./routes/ledger');

const { engine } = require('express-handlebars');
const jwt = require('jsonwebtoken');
const hbs = require("hbs");
const handlebarsHelpers = require('./helpers/handlebarHelpers');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();
require('./config/passport');



app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: handlebarsHelpers
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/user-app', userRoutes);
app.use('/Groups',groupRoutes);
app.use('/kyc',kycRoutes);
app.use('/pay',membershipRoute);
app.use('/announcements',announcementsRoute);
app.use('/superadmin', superAdminRoutes);
app.use('/rates', ratesRoutes);
app.use('/businesses', businessRoutes);
app.use('/ledger', ledgerRoutes);

// Serve superadmin frontend if needed
app.use('/superadmin-frontend', express.static(path.join(__dirname, 'superadmin-frontend')));

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Simple help page
app.get('/help', (req, res) => {
    try {
        return res.render('help', { layout: false });
    } catch (err) {
        return res.status(500).send('Help page unavailable');
    }
});

const corsOptions = {
   origin: 'https://mysarafa.com',  // Change to 'http://localhost:xxxx' for dev
  //origin: 'http://localhost:5500',
    credentials: true,
    optionsSuccessStatus: 200
};

app.get('/authcheck', cors(corsOptions), (req, res) => {
  const token = req.cookies.token; 
  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Your secret & algorithm
    // Optional: add extra checks (e.g., user still exists in DB)

    res.json({ loggedIn: true /* , user: { name: decoded.name } if needed */ });
  } catch (err) {
    res.status(401).json({ loggedIn: false });
  }
});
app.all('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    next(err);
});


app.use(errorHandler);

// app.use((req, res, next) => {
// //   const error = new Error('Page not found');
//   error.status = 404;
//   next(error);
// });


app.set('socketio', io);
io.on('connection', (socket) => {
    console.log(`New connection: socket.id=${socket.id}`);

    // Handle joinRoom event
    socket.on('joinRoom', (userId) => {
        if (!userId) {
            console.error(`JoinRoom failed: No userId provided for socket.id=${socket.id}`);
            return;
        }
        socket.join(userId);
        console.log(`User ${userId} joined room with socket.id=${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: socket.id=${socket.id}`);
    });
});

// app.get("/gold-prices", (req, res) => {
//   res.render("goldPrices", { title: "Live Gold Prices (INR)" });
// });setInterval(async () => {
//   const gold = await fetchGoldData();
//   if (gold) io.emit("goldData", gold);
// }, 1000);

// Export io for use in controllers
module.exports = { app, server };

const PORT = process.env.PORT || 5001;

mongoose.connection.once('open', () => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});


// Connect to MongoDB
require('./config/conn');