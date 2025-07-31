const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const User = require('./MODELS/User');
const List = require('./MODELS/List');
const Resource = require('./MODELS/Resource'); 
const Upload = require('./MODELS/Upload');
dotenv.config();

const app = express();

// Configure file upload storage
const uploadDir = path.join(__dirname, 'public', 'upload');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|jpeg|jpg|png|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, images (JPEG, JPG, PNG), and text files are allowed!'));
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/upload', express.static(path.join(__dirname, 'public', 'upload')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error(err));

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Add formatDate helper to all templates
app.locals.formatDate = (date) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Splash Screen
app.get('/', (req, res) => {
  res.render('splash');
});

// ======================== AUTH ROUTES ========================

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { userEmail, userPassword } = req.body;
  try {
    const user = await User.findOne({ userEmail: userEmail.toLowerCase().trim() });
    if (!user) return res.render('login', { error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);
    if (!isMatch) return res.render('login', { error: 'Invalid email or password' });

    req.session.userId = user._id;
    req.session.user = {
      _id: user._id,
      userName: user.userName,
      userEmail: user.userEmail
    };

    res.redirect('/home');
  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', { error: 'Server error' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { userName, userEmail, userPassword } = req.body;
  try {
    const existingUser = await User.findOne({ userEmail });
    if (existingUser) return res.render('register', { error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const user = new User({ userName, userEmail, userPassword: hashedPassword });
    await user.save();

    res.redirect('/login');
  } catch (err) {
    console.error('Register Error:', err);
    res.render('register', { error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Forgot Password - GET
app.get('/forgot', (req, res) => {
  res.render('forgot', { error: null, message: null });
});

// Forgot Password - POST
app.post('/forgot', async (req, res) => {
  const { userEmail } = req.body;
  try {
    const user = await User.findOne({ userEmail });
    if (!user) return res.render('forgot', { error: 'No user with that email found', message: null });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.userEmail,
      from: process.env.EMAIL,
      subject: 'StudyBuddy - Password Reset',
      html: `<p>You requested a password reset</p><p>Click <a href="http://localhost:${process.env.PORT || 7070}/reset/${token}">here</a> to reset your password</p>`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Mail Error:', err);
        return res.render('forgot', { error: 'Error sending email', message: null });
      }
      res.render('forgot', {
        error: null,
        message: 'Check your email for the reset link'
      });
    });
  } catch (err) {
    console.error('Forgot Error:', err);
    res.render('forgot', { error: 'Server error', message: null });
  }
});

// Reset Password Routes
app.get("/reset/:token", async (req, res) => {
  const token = req.params.token;
  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) return res.render("reset", { token: null, error: "Token expired or invalid", success: null });
  res.render("reset", { token, error: null, success: null });
});

app.post("/reset/:token", async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) return res.render("reset", { token: null, error: "Token expired or invalid", success: null });
  if (password !== confirmPassword) return res.render("reset", { token, error: "Passwords do not match", success: null });

  const hashedPassword = await bcrypt.hash(password, 10);
  user.userPassword = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.render("reset", { token: null, error: null, success: "Password reset successful! You can now login." });
});

// ======================== MAIN ROUTES ========================

app.get('/home', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    // Get stats for dashboard
    const subjectsCount = await List.distinct('subject', { addedBy: req.session.userId })
                                  .then(subjects => subjects.length);
    const notesCount = await Upload.countDocuments({ user: req.session.userId });
    
    res.render('home', {
      user: req.session.user,
      stats: {
        subjects: subjectsCount,
        uploadsCount: notesCount
      }
    });
  } catch (err) {
    console.error('Home error:', err);
    res.status(500).render('home', {
      user: req.session.user,
      stats: {
        subjects: 0,
        upload: 0
      },
      error: 'Failed to load dashboard data'
    });
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    const subjectsCount = await List.distinct('subject', { addedBy: req.session.userId }).then(subjects => subjects.length);
    const notesCount = await List.countDocuments({ addedBy: req.session.userId });

    res.render('dashboard', {
      user: req.session.user,
      stats: {
        subjects: subjectsCount,
        upload: notesCount
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('dashboard', {
      user: req.session.user,
      stats: {
        subjects: 0,
        upload: 0
      },
      error: 'Failed to load dashboard data'
    });
  }
});

app.get('/subjects', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('subjects', {
      user: req.session.user,
    });
  } catch (err) {
    console.error('Subjects page error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ======================== UPLOAD ROUTES ========================

app.get('/upload', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [upload, totalCount] = await Promise.all([
      Upload.find({ user: req.session.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Upload.countDocuments({ user: req.session.userId })
    ]);

    const subjects = await Upload.distinct('subject', { user: req.session.userId });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.render('upload', {
      user: req.session.user,
      upload,
      subjects,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        nextPage: page + 1,
        previousPage: page - 1
      },
      currentFilter: req.query.subject || 'all'
    });

  } catch (err) {
    console.error('Upload page error:', err);
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Failed to load upload. Please try again later.';
    
    res.status(500).render('error', {
      user: req.session.user || null,
      error: errorMessage,
      redirectUrl: '/home',
      redirectText: 'Back to Home'
    });
  }
});

app.get('/upload/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const upload = await Upload.findOne({ 
      _id: req.params.id,
      user: req.session.userId 
    });

    if (!upload) return res.status(404).json({ error: 'Upload not found' });
    
    res.json(upload);
  } catch (err) {
    console.error('Get upload error:', err);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Enhanced upload route with better error handling
app.post('/upload/upload', upload.single('file'), async (req, res, next) => {
  try {
    console.log('Upload request received');
    console.log('File info:', {
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      filename: req.file?.filename
    });
    console.log('Body:', req.body);

    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized - Please login to upload files' 
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }

    if (!req.file || !req.body.title) {
      if (req.file?.filename) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields. Title and file are required.' 
      });
    }

    let fileType;
    let content = '';
    const mimeType = req.file.mimetype;

    // Determine file type
    if (mimeType.includes('pdf')) {
      fileType = 'pdf';
    } else if (mimeType.includes('image')) {
      fileType = 'image';
    } else if (mimeType.includes('text') || path.extname(req.file.originalname).toLowerCase() === '.txt') {
      fileType = 'text';
      try {
        const filePath = path.join(uploadDir, req.file.filename);
        content = fs.readFileSync(filePath, 'utf8');
      } catch (readErr) {
        console.error('Error reading text file:', readErr);
      }
    } else {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ 
        success: false,
        error: 'Unsupported file type' 
      });
    }

    const newUpload = new Upload({
      title: req.body.title.trim(),
      description: req.body.description?.trim() || '',
      filename: req.file.filename,
      fileType,
      content,
      fileSize: req.file.size,
      originalName: req.file.originalname,
      user: req.session.userId,
      subject: req.body.subject || 'General'
    });

    await newUpload.save();

    res.status(201).json({ 
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: newUpload._id,
        title: newUpload.title,
        fileType: newUpload.fileType,
        createdAt: newUpload.createdAt
      }
    });

  } catch (err) {
    console.error('Detailed upload error:', {
      message: err.message,
      stack: err.stack,
      file: req?.file,
      body: req?.body
    });
    
    if (req.file?.filename) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? `Upload failed: ${err.message}`
        : 'Failed to process upload. Please try again.'
    });
  }
}, (err, req, res, next) => {
  // Multer error handler
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false,
      error: err.message 
    });
  } else if (err) {
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
  next();
});

app.delete('/upload/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const upload = await Upload.findOne({ 
      _id: req.params.id,
      user: req.session.userId 
    });

    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    if (upload.filename) {
      const filePath = path.join(uploadDir, upload.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Upload.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

// ======================== RESOURCE ROUTES ========================

app.get('/resources', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('resources', {
      user,
      branches: ['CSE', 'AIML', 'CIC', 'ECE','AIDS','CIVIL','MECH','IT','CSIT','CSD','EEE'],
      years: ['1', '2', '3', '4'],
      semesters: ['1', '2']
    });
    
  } catch (err) {
    console.error('Resources error:', err);
    res.status(500).render('error', {
      user: req.session.user || null,
      message: 'Failed to load resources'
    });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { branch, year, semester, subject, search } = req.query;
    
    const filter = { 
      $or: [
        { isPublic: true },
        { addedBy: req.session.userId }
      ]
    };

    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        ...filter.$or,
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const resources = await Resource.find(filter)
      .populate('addedBy', 'userName')
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    console.error('API Resources error:', err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { topic, branch, year, semester, subject, link, type, isPublic } = req.body;
    
    const newResource = new Resource({
      topic,
      branch,
      year,
      semester,
      subject,
      link,
      type,
      isPublic: isPublic || false,
      addedBy: req.session.userId
    });

    await newResource.save();
    res.status(201).json(newResource);
  } catch (err) {
    console.error('Create Resource error:', err);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// ======================== ERROR HANDLERS ========================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    user: req.session.user || null,
    error: err
  });
});

app.use((req, res) => {
  res.status(404).render('404', {
    user: req.session.user || null,
    message: 'Page not found'
  });
});

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});