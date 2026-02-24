const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true }, // Scanned by USB scanner
  name: { type: String, required: true },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stockQuantity: { type: Number, required: true },
  expiryDate: { type: Date, required: true }
});

module.exports = mongoose.model('Product', productSchema);