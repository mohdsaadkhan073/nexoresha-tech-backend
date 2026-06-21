const mongoose = require("mongoose");

const internSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Intern name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Intern email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/.+\@.+\..+/, "Please fill a valid email address"]
        },
        phone: {
            type: String,
            required: [true, "Intern phone number is required"],
            trim: true
        },
        aadhaarNumber: {
            type: String,
            required: [true, "Aadhaar number is required"],
            trim: true
        },
        collegeName: {
            type: String,
            required: [true, "College name is required"],
            trim: true
        },
        yearOfStudy: {
            type: Number,
            required: [true, "Year of study is required"]
        },
        documents: {
            collegeIdCard: {
                type: String,
                required: [true, "College ID card document URL/path is required"]
            },
            aadhaarCard: {
                type: String,
                required: [true, "Aadhaar card document URL/path is required"]
            }
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        rejectionReason: {
            type: String,
            default: ""
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null
        },
        approvedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Intern", internSchema);
