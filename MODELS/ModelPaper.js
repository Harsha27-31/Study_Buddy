const mongoose = require('mongoose');

const modelPaperSchema = new mongoose.Schema({
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
  examType: {
    type: String,
    required: true,
    enum: ['midterm', 'final', 'quiz', 'model', 'previous']
  },
  yearOfExam: {
    type: String,
    required: true
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

module.exports = mongoose.model('ModelPaper', modelPaperSchema);