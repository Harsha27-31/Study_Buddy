const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  topic: { type: String, required: true },
  link: { type: String, required: true },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// ✅ Use cached model if exists (prevents OverwriteModelError)
module.exports = mongoose.models.List || mongoose.model('List', listSchema);
