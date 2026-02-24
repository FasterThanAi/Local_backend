require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose'); 

// Import your Database Models (Fixed the 's' in Product)
const Product = require('./models/Products');
const Customer = require('./models/Customer');
const Bill = require('./models/Bill');

// Initialize Express
const app = express();
app.use(express.json()); // Allows server to read JSON from React/Postman

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected Successfully!"))
  .catch((err) => console.log("Database Connection Failed: ", err));

// ==========================================
// 1. CORE BILLING LOGIC FUNCTION
// ==========================================
async function processCheckout(cartItems, paymentMode, customerId = null) {
  try {
    let totalAmount = 0;

    for (let item of cartItems) {
      totalAmount += (item.price * item.quantity);
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity } 
      });
    }

    const newBill = new Bill({
      items: cartItems,
      totalAmount: totalAmount,
      paymentMode: paymentMode,
      customerId: customerId
    });
    await newBill.save();

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
// 2. BROWSER TEST ROUTES (GET)
// ==========================================
app.get('/', (req, res) => {
  res.send("<h1>Hello Rishu! The server is officially alive!</h1>");
});

app.get('/test-add-product', async (req, res) => {
  try {
    const newProduct = new Product({
      barcode: "890123456",
      name: "Parle-G Gold",
      mrp: 20,
      sellingPrice: 18,
      stockQuantity: 50,
      expiryDate: new Date("2026-12-31")
    });
    await newProduct.save(); 
    res.send("<h1>Success! Parle-G added to database.</h1>");
  } catch (error) {
    res.send("<h1>Error: " + error.message + "</h1>");
  }
});

// ==========================================
// 3. YOUR PROJECT API ROUTES (POST)
// ==========================================
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json({ message: "Product Added to Inventory", product: newProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json({ message: "Customer Profile Created", customer: newCustomer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

// ==========================================
// 4. NEW FETCH ROUTES (GET) - ADDED HERE!
// ==========================================
// API: Fetch all products (For your React Inventory Screen)
app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await Product.find(); 
    res.status(200).json(allProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Fetch all customers (For your React Udhaar Screen)
app.get('/api/customers', async (req, res) => {
  try {
    const allCustomers = await Customer.find(); 
    res.status(200).json(allCustomers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. THE FINAL PIECES (View Bills & Clear Udhaar)
// ==========================================

// API: Fetch all bills (For the Shopkeeper's Sales History Screen)
app.get('/api/bills', async (req, res) => {
  try {
    // .populate() is magic! It swaps the raw customerId with the actual Customer's Name and Phone from the database.
    const allBills = await Bill.find().populate('customerId', 'name phone'); 
    res.status(200).json(allBills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Customer pays back their Udhaar
app.post('/api/customers/pay', async (req, res) => {
  try {
    const { customerId, amountPaid } = req.body;
    
    // Find the customer and SUBTRACT the amount paid from their balance
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { $inc: { udhaarBalance: -amountPaid } }, // Notice the minus sign!
      { new: true } // This tells MongoDB to return the newly updated customer data
    );
    
    res.status(200).json({ 
      success: true, 
      message: `Payment of ₹${amountPaid} received!`, 
      customer: updatedCustomer 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ==========================================
// START SERVER (Always at the bottom)
// ==========================================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});