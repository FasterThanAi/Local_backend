require('dotenv').config(); // 1. Load environment variables first
const express = require('express');
const mongoose = require('mongoose'); // 2. Declare mongoose EXACTLY ONCE here

// Import your Database Models
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');

// Initialize Express
const app = express();
app.use(express.json()); // Allows server to read JSON

// Connect to MongoDB securely using the link from your .env file
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected Successfully!"))
  .catch((err) => console.log("Database Connection Failed: ", err));

// ==========================================
// THE BILLING LOGIC
// ==========================================
async function processCheckout(cartItems, paymentMode, customerId = null) {
  try {
    let totalAmount = 0;

    // Calculate Total & Deduct Stock
    for (let item of cartItems) {
      totalAmount += (item.price * item.quantity);
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity } 
      });
    }

    // Create the Bill
    const newBill = new Bill({
      items: cartItems,
      totalAmount: totalAmount,
      paymentMode: paymentMode,
      customerId: customerId
    });
    await newBill.save();

    // Credit Update
    if (paymentMode === 'Credit' && customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { udhaarBalance: totalAmount }
      });
      console.log("Udhaar Ledger Updated!");
    }

    return newBill;
  } catch (error) {
    console.log("Error during checkout: ", error);
    throw error; 
  }
}

// ==========================================
// THE API ROUTE
// ==========================================
app.post('/api/checkout', async (req, res) => {
  try {
    const { cartItems, paymentMode, customerId } = req.body;
    const generatedBill = await processCheckout(cartItems, paymentMode, customerId);

    res.status(200).json({ 
        success: true, 
        message: "Checkout Complete! Bill Generated.",
        bill: generatedBill 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Checkout failed", error: error.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});