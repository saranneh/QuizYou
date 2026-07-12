const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., "CS591"
  name: { type: String, required: true }, // e.g., "Software Engineering"
  description: { type: String }
});

module.exports = mongoose.model('Course', courseSchema);
