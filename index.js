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

// Enhanced file filter for uploads
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|jpeg|jpg|png|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, images (JPEG, JPG, PNG), and text files are allowed!'), false);
  }
};
// Add at the top of your file
const requiredEnvVars = ['MONGO_URL', 'EMAIL', 'EMAIL_PASS'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Missing required environment variable: ${env}`);
    process.exit(1);
  }
});
// In your server file (e.g., app.js or routes file)


const upload = multer({
    dest: 'public/uploads/avatars/',
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Improved avatar upload route
app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
      if (!req.user) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Delete old avatar if exists
      const user = await User.findById(req.user._id);
      if (user.avatar) {
          const oldAvatarPath = path.join(__dirname, 'public', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
              fs.unlinkSync(oldAvatarPath);
          }
      }

      // Update user's avatar in database
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user._id, { avatar: avatarPath });

      res.json({ 
          success: true,
          avatarUrl: avatarPath
      });
  } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ success: false, message: 'Error uploading avatar' });
  }
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/upload', express.static(uploadDir));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS middleware
// Update CORS middleware to allow PDF.js worker
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  next();
});

// Enhanced MongoDB connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// Session Setup
// Update session config for better security
app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGO_URL,
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    }
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



// Profile Route
app.get('/profile', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    const stats = {
      subjects: await List.distinct('subject', { addedBy: req.session.userId }).then(subjects => subjects.length),
      uploadsCount: await Upload.countDocuments({ user: req.session.userId }),
      sharedResources: await Resource.countDocuments({ addedBy: req.session.userId })
    };

    res.render('profile', {
      user,
      stats
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).render('error', {
      user: req.session.user || null,
      error: 'Failed to load profile'
    });
  }
});
// app.get('/profile', (req, res) => {
//   // Assuming you have user data in req.user or from session
//   res.render('profile', {
//       user: {
//           name: req.user.fullName,
//           email: req.user.email,
//           role: req.user.role || 'Student',
//           joinDate: req.user.createdAt.toLocaleDateString(),
//           // location: req.user.location || 'Not specified',
//           // accountType: req.user.accountType || 'Standard',
//           // institution: req.user.institution || 'Not specified'
//       }
//   });
// });
// Settings Route
app.get('/settings', async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/login');
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('settings', {
      user
    });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).render('error', {
      user: req.session.user || null,
      error: 'Failed to load settings'
    });
  }
});

// API Route for updating profile
app.post('/api/update-profile', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { userName, userEmail } = req.body;
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      userEmail,
      _id: { $ne: req.session.userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already in use by another account' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { userName, userEmail },
      { new: true }
    );

    // Update session with new user data
    req.session.user = {
      _id: updatedUser._id,
      userName: updatedUser.userName,
      userEmail: updatedUser.userEmail
    };

    res.json({ 
      success: true,
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// API Route for changing password
app.post('/api/change-password', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy();
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.userPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.userPassword = hashedPassword;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password'
    });
  }
});

// API Route for deleting account
app.delete('/api/delete-account', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Delete user data
    await Promise.all([
      User.deleteOne({ _id: req.session.userId }),
      List.deleteMany({ addedBy: req.session.userId }),
      Resource.deleteMany({ addedBy: req.session.userId }),
      Upload.deleteMany({ user: req.session.userId })
    ]);

    // Destroy session
    req.session.destroy();

    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete account'
    });
  }
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
// Add this before your upload routes
app.use('/upload', (req, res, next) => {
  // Prevent directory traversal
  if (req.path.includes('../') || req.path.includes('..\\')) {
    return res.status(403).send('Access denied');
  }
  next();
});
app.get('/model-papers', (req, res) => {
  res.render('modelpapers')
});
app.get('/help', (req, res) => {
  res.render('help'); // Render your help page
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
app.get('/help/search', (req, res) => {
  const query = req.query.q;
  // Search your knowledge base or FAQ database
  res.render('search-results', { query });
});
app.post('/api/support', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'support@studybuddy.com',
      subject: `Support Request: ${subject}`,
      text: `From: ${name} (${email})\n\n${message}`
    });
    

    res.status(200).json({ success: true, message: 'Support request received' });
  } catch (error) {
    console.error('Support request error:', error);
    res.status(500).json({ success: false, message: 'Error processing request' });
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
// Add this route to check if file exists before displaying
app.get('/upload/check/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.json({ exists: false });
    }
    
    res.json({ 
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      isPDF: path.extname(req.params.filename).toLowerCase() === '.pdf'
    });
  });
});

app.get('/upload/:id', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const upload = await Upload.findOne({ 
      _id: req.params.id,
      user: req.session.userId 
    }).lean();

    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    // Add additional file info
    const filePath = path.join(uploadDir, upload.filename);
    const fileExists = fs.existsSync(filePath);
    
    res.json({
      ...upload,
      fileExists,
      fileUrl: `/upload/${upload.filename}`,
      pdfViewUrl: upload.fileType === 'pdf' ? `/upload/pdf/${upload.filename}` : null
    });
  } catch (err) {
    console.error('Get upload error:', err);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Enhanced upload route with better error handling
app.post('/upload/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    // Determine file type
    let fileType;
    const mimeType = req.file.mimetype;
    
    if (mimeType === 'application/pdf') {
      fileType = 'pdf';
    } else if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else {
      fileType = 'text';
    }

    const newUpload = new Upload({
      title: req.body.title,
      description: req.body.description,
      filename: req.file.filename,
      fileType,
      fileSize: req.file.size,
      originalName: req.file.originalname,
      user: req.session.userId,
      subject: req.body.subject || 'General',
      fileUrl: `/upload/${req.file.filename}`
    });

    await newUpload.save();

    res.json({ 
      success: true,
      message: 'File uploaded successfully',
      upload: newUpload
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload file'
    });
  }
});
// Update your existing PDF route to better handle range requests
// Add this middleware to protect against malicious PDFs
app.use('/upload/pdf/:filename', (req, res, next) => {
  const filename = req.params.filename;
  if (!filename.match(/^[a-zA-Z0-9\-_]+\.pdf$/)) {
    return res.status(403).send('Invalid file name');
  }
  next();
});
app.get('/upload/pdf/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests (for PDF.js)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(filePath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Regular request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'application/pdf',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });
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

    const { branch, year, semester, subject, search, type } = req.query;
    
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
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        ...filter.$or,
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } }
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
app.get('/api/resources', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { branch, year, semester, subject, search, type } = req.query;
    
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
    if (type) filter.type = type;
    
    if (search) {
      filter.$or = [
        ...filter.$or,
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } }
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
app.get('/api/pdf-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    // Pipe the PDF stream to the response
    response.data.pipe(res);
  } catch (err) {
    console.error('PDF Proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});
// Add helmet for security headers
const helmet = require('helmet');
app.use(helmet());

// Add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
// ======================== ERROR HANDLERS ========================

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
          success: false,
          error: err.message 
      });
  }
  
  // Handle other errors
  res.status(500).render('error', {
      user: req.session.user || null,
      error: process.env.NODE_ENV === 'development' ? err : 'Something went wrong!',
      redirectUrl: '/home',
      redirectText: 'Back to Home'
  });
});

app.use((req, res) => {
  res.status(404).render('404', {
    user: req.session.user || null,
    message: 'Page not found'
  });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memoryUsage: process.memoryUsage()
  });
});

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});