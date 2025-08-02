// const express = require('express');
// const router = express.Router();
// const bodyParser = require('body-parser');
// const app = express();

// // Middleware
// app.use(bodyParser.json());

// // Help Center Routes
// router.get('/help', (req, res) => {
//   res.render('help'); // Render your help page
// });

// router.get('/help/search', (req, res) => {
//   const query = req.query.q;
//   // Search your knowledge base or FAQ database
//   res.render('search-results', { query });
// });

// router.post('/api/support', async (req, res) => {
//   try {
//     const { name, email, subject, message } = req.body;
    
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: 'support@studybuddy.com',
//       subject: `Support Request: ${subject}`,
//       text: `From: ${name} (${email})\n\n${message}`
//     });
//     */

//     res.status(200).json({ success: true, message: 'Support request received' });
//   } catch (error) {
//     console.error('Support request error:', error);
//     res.status(500).json({ success: false, message: 'Error processing request' });
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// module.exports = router;  // Here you would typically:
//     // 1. Validate the input
//     // 2. Save to database
//     // 3. Send email notification
    
//     // Example using nodemailer to send email
//     /*