const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionCode: { type: String, required: true }, // e.g., "A1"
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of enrolled students
  semester: { type: String, required: true } // e.g., "Fall 2026"
});

module.exports = mongoose.model('Section', sectionSchema);
