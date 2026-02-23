const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Slug otomatik oluşturma
CategorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);
