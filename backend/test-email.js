require('dotenv').config();
const { sendPasswordReset } = require('./utils/email');

async function testEmail() {
    console.log('Testing Email Sending...');
    console.log('Using EMAIL_USER:', process.env.EMAIL_USER);

    const testToken = 'test-token-12345';
    const testEmail = process.env.EMAIL_USER; // Kendi mailine gönder

    const success = await sendPasswordReset(testEmail, 'Test User', testToken);

    if (success) {
        console.log('✅ Success! Check your inbox (or spam folder).');
    } else {
        console.log('❌ Failed to send email. Check logs above.');
    }
    process.exit();
}

testEmail();
