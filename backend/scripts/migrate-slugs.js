/**
 * Migration: Mevcut ürünlere slug oluştur
 * Kullanım: node scripts/migrate-slugs.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');

async function migrateSlugs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB bağlantısı kuruldu');

        const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
        console.log(`${products.length} ürüne slug oluşturulacak...`);

        for (const product of products) {
            await product.save(); // pre-save hook slug oluşturacak
            console.log(`✅ ${product.title} → /${product.slug}`);
        }

        console.log('\nMigrasyon tamamlandı!');
        process.exit(0);
    } catch (err) {
        console.error('Hata:', err);
        process.exit(1);
    }
}

migrateSlugs();
