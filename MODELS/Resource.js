const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true,
    enum: ['CSE', 'AIML', 'CIC', 'ECE']
  },
  year: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4']
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2']
  },
  subject: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['pdf', 'video', 'link']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', ResourceSchema);