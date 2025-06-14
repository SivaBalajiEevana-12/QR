const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    whatsappNumber: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        min: 0,
        max: 150,
    },
    collegeOrWorking: {
        type: String,
        enum: ['college', 'working', 'other'],
    },
    place: {
        type: String,
        trim: true,
    },
    selectedBook: {
        type: String,
    },
    interestedInGitaSession: {
        type: Boolean,
        required: true,
    },

    // 🆕 For QR-based verification
    userId: {
        type: String,
        unique: true,
        required: true,
    },
    qrPath: {
        type: String, // Local path or public URL
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verifiedAt: {
        type: Date,
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('User', UserSchema);
