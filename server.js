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
app.use(express.static(path.join(__dirname, '.'))); // Static files serve karne ke liye

// --- MONGODB CONNECTION ---
// Render par deploy karne ke liye MongoDB Atlas ka URL use karein. 
// Agar abhi nahi hai toh ye local wala hi rahega par connect nahi hoga.
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/DILICART-clone";

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("✅ Connected to MongoDB");
        try {
            await mongoose.connection.db.collection('orders').dropIndexes();
            console.log("🗑️ Old Indexes Cleared");
        } catch (e) {
            console.log("ℹ️ No old indexes to clear.");
        }
    })
    .catch(err => console.log("❌ DB Connection Error:", err));

// --- SCHEMAS ---
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    description: String,
    category: { type: String, default: "General" }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userName: String,
    userEmail: String,
    items: Array,
    totalAmount: Number,
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}, { strict: false }));

// --- API ROUTES ---

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

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products" });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { userName, userEmail, items, totalAmount, paymentMethod } = req.body;
        if (!userEmail || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Order Data" });
        }
        const newOrder = new Order({ userName, userEmail, items, totalAmount, paymentMethod });
        const savedOrder = await newOrder.save();
        res.status(201).json({ success: true, orderId: savedOrder._id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ADMIN ROUTES ---
app.post('/api/admin/add-product', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ success: true, message: "Product added!" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- SERVE FRONTEND ---
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "index.html"));
});

// --- START SERVER ---
// Render automatically PORT environment variable provide karta hai
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
