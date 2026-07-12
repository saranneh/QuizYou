const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "abhikoka" or "saranneh"
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['student', 'professor'], default: 'student' }
});

module.exports = mongoose.model('User', userSchema);
