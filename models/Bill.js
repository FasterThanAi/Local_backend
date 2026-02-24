const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Credit'], required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null }
});

module.exports = mongoose.model('Bill', billSchema);