const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- MONGODB CONNECTION ---
const MONGO_URI = "mongodb://127.0.0.1:27017/DILICART-clone";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ Connected to MongoDB: DILICART-clone");
        
        // --- CRITICAL FIX: Purane duplicate indexes ko delete karna ---
        try {
            await mongoose.connection.db.collection('orders').dropIndexes();
            console.log("🗑️ Old Indexes Cleared (Duplicate error fixed!)");
        } catch (e) {
            console.log("ℹ️ No old indexes to clear or collection is new.");
        }
    })
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- SCHEMAS ---

// 1. User Schema
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
}));

// 2. Product Schema
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String,
    category: { type: String, default: "General" }
}));

// 3. Order Schema (Simplified to avoid errors)
const Order = mongoose.model('Order', new mongoose.Schema({
    userName: String,
    userEmail: String,
    items: Array,
    totalAmount: Number,
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}, { strict: false })); // strict: false extra fields allow karta hai

// --- API ROUTES ---

// --- USER LOGIN ---
app.post('/api/user/login', async (req, res) => {
    try {
        const { email, name } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name: name || 'Guest', email });
            await user.save();
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// --- GET PRODUCTS ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products" });
    }
});

// --- PLACE ORDER (Fix applied here) ---
app.post('/api/orders', async (req, res) => {
    try {
        const { userName, userEmail, items, totalAmount, paymentMethod } = req.body;
        
        if (!userEmail || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Order Data" });
        }

        const newOrder = new Order({
            userName, 
            userEmail, 
            items, 
            totalAmount, 
            paymentMethod
        });

        const savedOrder = await newOrder.save();
        console.log("✅ Order Saved Success:", savedOrder._id);
        
        res.status(201).json({ 
            success: true, 
            orderId: savedOrder._id,
            message: "Order placed!" 
        });
    } catch (err) {
        console.error("❌ Order Error:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Database error: " + err.message 
        });
    }
});

// --- ADMIN ROUTES ---

// Add Product
app.post('/api/admin/add-product', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ success: true, message: "Product added!" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// View Orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
});

// Delete Product
app.delete('/api/admin/product/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- START SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});