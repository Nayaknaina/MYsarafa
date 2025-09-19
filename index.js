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


// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});



app.use(errorHandler);

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