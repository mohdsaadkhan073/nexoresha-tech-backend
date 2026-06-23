const Intern = require("../models/intern.model");
const generateToken = require("../utils/generateToken");

exports.registerIntern = async (req, res) => {
    try {
        const { name, email, password, phone, aadhaarNumber, collegeName, yearOfStudy } = req.body;

        // Check if required text fields are provided
        if (!name || !email || !password || !phone || !aadhaarNumber || !collegeName || !yearOfStudy) {
            return res.status(400).json({ success: false, message: "All text fields (including password) are required." });
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
            password,
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

exports.loginIntern = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide both email and password" });
        }

        const intern = await Intern.findOne({ email });
        if (!intern) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await intern.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = generateToken(intern._id, intern.email, intern.tokenVersion);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                intern: {
                    id: intern._id,
                    name: intern.name,
                    email: intern.email,
                    status: intern.status
                },
                token
            }
        });
    } catch (error) {
        console.error("Login Intern Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error during login" });
    }
};

exports.getInternStatus = async (req, res) => {
    try {
        // req.intern is populated by internAuth middleware
        const intern = await Intern.findById(req.intern._id).select("status rejectionReason name email");
        if (!intern) {
            return res.status(404).json({ success: false, message: "Intern not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                name: intern.name,
                email: intern.email,
                status: intern.status,
                rejectionReason: intern.rejectionReason
            }
        });
    } catch (error) {
        console.error("Get Intern Status Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error while fetching status" });
    }
};
