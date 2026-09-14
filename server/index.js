const express= require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path');
dotenv.config({ quiet: true, override: true });
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

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});