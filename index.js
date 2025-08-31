const express = require('express');
const mongoose = require('mongoose');
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

const { engine } = require('express-handlebars');
const jwt = require('jsonwebtoken');
const hbs = require("hbs");
const handlebarsHelpers = require('./helpers/handlebarHelpers');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();
require('./config/passport');

const app = express();

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


// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});



app.use(errorHandler);

const PORT = process.env.PORT || 5001;

mongoose.connection.once('open', () => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});


// Connect to MongoDB
require('./config/conn');