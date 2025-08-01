const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  pid: {
    type: String, // or String
    required: true,
    // unique: true,
    default:""
  },
  name: { type: String }, // Professor name (optional)
  cabinNo: { type: String, required: true, default: '' },
  noOfSeats: { type: Number, required: true ,default: 3},

  requests: [
    {
      members: {
        type: [
          {
            name: { type: String, required: true },
            regNo: { type: String, required: true }
          }
        ],
        validate: [arr => arr.length >= 1 && arr.length <= 3, 'Team must have 1 to 3 members']
      },
      isAccepted: { type: Boolean, default: false },
      requestedAt: { type: Date, default: Date.now }
    }
  ],

  acceptedTeams: [
    {
      members: [
        {
          name: { type: String, required: true },
          regNo: { type: String, required: true }
        }
      ],
      acceptedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('guide', guideSchema);
