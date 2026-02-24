const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  udhaarBalance: { type: Number, default: 0 } // Positive means they owe the shop money
});

module.exports = mongoose.model('Customer', customerSchema);