const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  pid: {
    type: String, // or String
    required: true,
    unique: true
  },
  name: { type: String, required: true }, // Professor name (optional)
  cabinNo: { type: String, required: true, default: '' },
  noOfSeats: { type: Number, required: true, default: 3 },

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
      acceptedAt: { type: Date, default: Date.now },
      submissions: [
        {
          type: { type: String, enum: ["Abstract", "Review 1", "Review 2", "Final Submission"] },
          files: [
            {
              fileUrl: { type: String, required: true },
              fileName: { type: String, required: true },
              uploadedAt: { type: Date, default: Date.now } // automatically sets current timestamp

            }
          ],
          status: { type: String, enum: ["pending", "accepted", "resubmit", "submitted"], default: "pending" },
          remarks: { type: String, default: "" },
          marks: [
            {
              regNo: { type: String, required: true },
              name: { type: String, required: true },
              score: { type: Number, default: 0 }
            }
          ]
        }
      ]

    }
  ]
});

module.exports = mongoose.models.guide || mongoose.model('guide', guideSchema);
