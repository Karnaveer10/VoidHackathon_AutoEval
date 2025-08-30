const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
  panelId: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  // Reference to Guide model
  guides: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide'
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Panel || mongoose.model('Panel', panelSchema);
