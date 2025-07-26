const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const crypto = require('crypto');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7070;
// Models and Utils
const Register = require('./MODELS/User');
const List = require('./MODELS/List');
const sendResetEmail = require('./UTILS/Mailer');
const notesRoutes = require('./Routes/Notes');
const studyData = require('./Put_Data/study_data.json')
app.get('/api/studydata', (req, res) => {
  res.json(studyData);
});


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('PUBLIC'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'VIEWS'));
app.use(express.static(path.join(__dirname, 'PUBLIC')));

// Session Configuration
app.use(
  session({
    secret: 'Its Confidential..',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error(`MongoDB Error: ${err}`);
    process.exit(1);
  });

// Custom Middleware
function isLoggedIn(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

// Routes
app.use('/notes', notesRoutes);

// Splash
app.get('/', (req, res) => {
  res.render('splash');
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Register Page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Forgot Password Page
app.get('/forgot', (req, res) => {
  res.render('forgot', { error: null, message: null });
});

// Upload Page
app.get('/upload', isLoggedIn, (req, res) => {
  res.render('upload');
});


// Dashboard Page
app.get('/dashboard', isLoggedIn, async (req, res) => {
  try {
    const notes = await List.find();
    const subjects = [...new Set(notes.map(note => note.subject))];
    res.render('dashboard', {
      user: req.session.user,
      notes,
      subjects
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Something went wrong");
  }
});

// Home Page
app.get('/home', (req, res) => {
  const user = req.session.user || null;
  res.render('home', { user });
});
app.get('/resources', (req, res) => {
  res.render('resources', { user: req.session.user });
});

app.get('/resources/:id', async (req, res) => {
  const { id } = req.params;
  const List = require('./MODELS/List');

  try {
    const data = await List.findById(id);
    if (!data) return res.status(404).send('Not found');

    res.render('resources', {
      data: {
        topic: data.topic,
        link: data.link,
        videos: data.videos || [] // assuming `videos` is an array of {title, link}
      }
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});


// Handle Login
app.post('/login', async (req, res) => {
  const { userEmail, userPassword } = req.body;

  if (!userEmail || !userPassword) {
    return res.render('login', { error: 'All fields are required!' });
  }

  try {
    const user = await Register.findOne({ userEmail });
    if (!user) {
      return res.render('login', { error: 'User not found!' });
    }

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch) {
      return res.render('login', { error: 'Incorrect password!' });
    }

    req.session.user = user;
    return res.redirect('/home');
  } catch (err) {
    console.error("Login Error:", err);
    return res.render('login', { error: 'Something went wrong. Try again.' });
  }
});

// Handle Forgot Password
app.post('/forgot', async (req, res) => {
  const { userEmail } = req.body;

  try {
    const user = await Register.findOne({ userEmail });
    if (!user) {
      return res.render('forgot', { error: 'No user with this email.', message: null });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendResetEmail(userEmail, token);
    return res.render('forgot', {
      error: null,
      message: 'Reset link sent to your email!'
    });
  } catch (err) {
    console.error("Forgot Error:", err);
    return res.render('forgot', { error: 'Something went wrong.', message: null });
  }
});

// Handle Password Reset
app.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await Register.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.send('Invalid or expired reset token.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.userPassword = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.send('Password successfully reset. <a href="/login">Go to Login</a>');
  } catch (err) {
    console.error("Reset Error:", err);
    res.send('Something went wrong. Try again.');
  }
});

// Handle Registration
app.post('/register', async (req, res) => {
  const { userName, userEmail, userPassword, confirmPassword } = req.body;

  if (!userName || !userEmail || !userPassword || !confirmPassword) {
    return res.render('register', { error: 'All fields are required!' });
  }

  if (userPassword !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match!' });
  }

  try {
    const existingUser = await Register.findOne({ userEmail });
    if (existingUser) {
      return res.render('register', { error: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 12);
    const newUser = await Register.create({
      userName,
      userEmail,
      userPassword: hashedPassword
    });

    req.session.user = newUser;
    res.redirect('/login');
  } catch (err) {
    console.error("Register Error:", err);
    res.render('register', { error: 'Something went wrong. Try again.' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout Error:", err);
    res.redirect('/login');
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
