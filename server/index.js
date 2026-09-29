const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
    // Ignore if not supported in environment
}
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true, override: true });
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const app = express();
const AdminRoutes = require('./routes/AdminRoutes');
const mongoDB = require('./config/db');
mongoDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check / Root route
app.get('/', (req, res) => {
    res.json({
        status: "online",
        message: "SoftPro Innovation Backend API is running successfully!",
        timestamp: new Date().toISOString()
    });
});

//API'S STARTED
app.use('/api/admin', AdminRoutes);
app.use('/api/category', require('./routes/CategoryRoutes'));
app.use('/api/user', require('./routes/UserRoutes'));
app.use('/api/product', require('./routes/ProductRoutes'));
app.use('/api/cart', require('./routes/CartRoutes'));
app.use('/api/address', require('./routes/AddressRoutes'));
app.use('/api/order', require('./routes/OrderRoutes'));
app.use('/api/payment', require('./routes/razorpayRoute'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another process. Please terminate the process using port ${PORT} or configure a different PORT in .env.`);
    } else {
        console.error('❌ Server error:', err.message);
    }
});