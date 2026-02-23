const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

async function checkCounts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.countDocuments();
        const users = await User.countDocuments();
        const products = await Product.countDocuments();

        console.log(`Orders: ${orders}`);
        console.log(`Users: ${users}`);
        console.log(`Products: ${products}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
