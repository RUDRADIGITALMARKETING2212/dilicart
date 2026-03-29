import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.'))); 

// --- MONGODB CONNECTION ---
// Render par environment variable (MONGO_URI) set karna na bhoolein
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/DILICART-clone";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- SCHEMAS ---

// User Schema (Address aur Mobile ke saath)
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    address: String,
    mobile: String,
    createdAt: { type: Date, default: Date.now }
}));

// Product Schema
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String,
    category: { type: String, default: "General" }
}));

// Order Schema (Sari details save karne ke liye)
const Order = mongoose.model('Order', new mongoose.Schema({
    userName: String,
    userEmail: String,
    address: String,
    mobile: String,
    items: Array,
    totalAmount: Number,
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}, { strict: false }));

// --- API ROUTES ---

// 1. User Login/Register
app.post('/api/user/login', async (req, res) => {
    try {
        const { email, name, address, mobile } = req.body;
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({ name, email, address, mobile });
            await user.save();
        } else {
            // Agar user hai toh uska address/mobile update kar dein
            user.address = address || user.address;
            user.mobile = mobile || user.mobile;
            await user.save();
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed" });
    }
});

// 2. Fetch All Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products" });
    }
});

// 3. Place New Order
app.post('/api/orders', async (req, res) => {
    try {
        const { userName, userEmail, address, mobile, items, totalAmount } = req.body;
        
        if (!userEmail || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Order Data" });
        }

        const newOrder = new Order({ 
            userName, 
            userEmail, 
            address, 
            mobile, 
            items, 
            totalAmount 
        });

        const savedOrder = await newOrder.save();
        res.status(201).json({ success: true, orderId: savedOrder._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ADMIN ROUTES ---

// 1. Add New Product
app.post('/api/admin/add-product', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ success: true, message: "Product added!" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// 2. View All Orders (Jo "Cannot GET" bol raha tha)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Orders fetch failed", error: err.message });
    }
});

// 3. Delete Order (Clean up ke liye)
app.delete('/api/admin/order/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Order deleted" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- SERVE FRONTEND ---
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "index.html"));
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 DiliCart Server running on port ${PORT}`);
});
