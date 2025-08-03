const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['1', '2']
  },
  year: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4']
  },
  branch: {
    type: [String],
    required: true,
    enum: ['CSE', 'AIML', 'CIC', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSIT']
  },
  link: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'pdf'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Syllabus', syllabusSchema);