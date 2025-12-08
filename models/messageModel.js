const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: { type: String, required: true },
    fromName:{type: String, required: true},
    to: [{ type: String, required: true }],
    messages: [
        {
            text: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
