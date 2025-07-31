const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  filename: String,
  fileType: { type: String, enum: ['pdf', 'image', 'text', 'other'] },
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);