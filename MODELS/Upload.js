const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  filename: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['pdf', 'image', 'text'] },
  content: String,
  fileSize: Number,
  originalName: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);