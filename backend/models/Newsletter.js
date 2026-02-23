const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'E-posta adresi gereklidir'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta adresi girin']
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
