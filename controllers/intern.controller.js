const Intern = require("../models/intern.model");

exports.registerIntern = async (req, res) => {
    try {
        const { name, email, phone, aadhaarNumber, collegeName, yearOfStudy } = req.body;

        // Check if required text fields are provided
        if (!name || !email || !phone || !aadhaarNumber || !collegeName || !yearOfStudy) {
            return res.status(400).json({ success: false, message: "All text fields are required." });
        }

        // Check if documents were uploaded
        if (!req.files || !req.files.collegeIdCard || !req.files.aadhaarCard) {
            return res.status(400).json({ success: false, message: "Both college ID card and Aadhaar card are required." });
        }

        // Check for duplicates
        const existingIntern = await Intern.findOne({
            $or: [{ email }, { phone }, { aadhaarNumber }]
        });

        if (existingIntern) {
            return res.status(400).json({ 
                success: false, 
                message: "Intern with this email, phone, or aadhaar already exists." 
            });
        }

        // Construct document paths
        const collegeIdCardPath = `/uploads/${req.files.collegeIdCard[0].filename}`;
        const aadhaarCardPath = `/uploads/${req.files.aadhaarCard[0].filename}`;

        // Create the intern record
        const newIntern = await Intern.create({
            name,
            email,
            phone,
            aadhaarNumber,
            collegeName,
            yearOfStudy,
            documents: {
                collegeIdCard: collegeIdCardPath,
                aadhaarCard: aadhaarCardPath
            },
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "Registration submitted successfully. Waiting for admin approval.",
            data: {
                internId: newIntern._id
            }
        });
    } catch (error) {
        console.error("Register Intern Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration.", error: error.message });
    }
};
