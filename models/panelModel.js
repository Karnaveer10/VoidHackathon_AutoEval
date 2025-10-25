const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pid: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },

  guides: {
    type: [String],
    default: []
  },

  // Each team has a reviews array
  marks: [
    {
      teams: [
        {
          type: {
            type: String,
            enum: ["Review 1", "Review 2", "Final Submission"],
            required: true
          },
          scheduledAt: { type: Date, default: Date.now },
          members: [
            {
              name: { type: String, required: true },
              regNo: { type: String, required: true },
              score: { type: Number, default: 0 }
            }
          ]
        }
      ]
    }
  ]
});

module.exports = mongoose.models.Panel || mongoose.model('Panel', panelSchema);
