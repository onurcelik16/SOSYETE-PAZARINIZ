require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const RENDER_API_URL = 'https://sosyete-pazariniz.onrender.com';

async function fixImageUrls() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const products = await Product.find({});
        let updatedCount = 0;

        for (const product of products) {
            let needsUpdate = false;

            // Fix main image
            if (product.image && (product.image.includes('localhost:5000') || product.image.startsWith('/uploads/'))) {
                const path = product.image.split('/uploads/')[1];
                product.image = `${RENDER_API_URL}/uploads/${path}`;
                needsUpdate = true;
            }

            // Fix images array
            if (product.images && product.images.length > 0) {
                const newImages = product.images.map(img => {
                    if (img && (img.includes('localhost:5000') || img.startsWith('/uploads/'))) {
                        const path = img.split('/uploads/')[1];
                        needsUpdate = true;
                        return `${RENDER_API_URL}/uploads/${path}`;
                    }
                    return img;
                });
                product.images = newImages;
            }

            if (needsUpdate) {
                await product.save();
                console.log(`Updated product: ${product.title}`);
                updatedCount++;
            }
        }

        console.log(`\nSuccess! ${updatedCount} products updated.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixImageUrls();
