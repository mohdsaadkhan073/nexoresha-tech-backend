const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Intern = require("../models/intern.model");

// Helper function to sign JWT token
const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });
};

/**
 * @desc    Admin login to get token
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password"
            });
        }

        // 2. Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Compare password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Generate token
        const token = generateToken(admin._id, admin.email);

        // 5. Respond with basic info + token
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email
                },
                token
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
};

/**
 * @desc    Get all interns (latest first)
 * @route   GET /api/admin/interns
 * @access  Private (Admin)
 */
const getAllInterns = async (req, res) => {
    try {
        const interns = await Intern.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error("Get all interns error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching interns"
        });
    }
};

/**
 * @desc    Get pending interns
 * @route   GET /api/admin/interns/pending
 * @access  Private (Admin)
 */
const getPendingInterns = async (req, res) => {
    try {
        const interns = await Intern.find({ status: "pending" }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Pending interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error("Get pending interns error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching pending interns"
        });
    }
};

/**
 * @desc    Get approved interns
 * @route   GET /api/admin/interns/approved
 * @access  Private (Admin)
 */
const getApprovedInterns = async (req, res) => {
    try {
        const interns = await Intern.find({ status: "approved" }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Approved interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error("Get approved interns error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching approved interns"
        });
    }
};

/**
 * @desc    Get rejected interns
 * @route   GET /api/admin/interns/rejected
 * @access  Private (Admin)
 */
const getRejectedInterns = async (req, res) => {
    try {
        const interns = await Intern.find({ status: "rejected" }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Rejected interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error("Get rejected interns error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching rejected interns"
        });
    }
};

/**
 * @desc    Get single intern details by ID
 * @route   GET /api/admin/interns/:id
 * @access  Private (Admin)
 */
const getInternById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId to prevent CastError/Server crash
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        const intern = await Intern.findById(id).populate("approvedBy", "name email");
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Intern details retrieved successfully",
            data: intern
        });
    } catch (error) {
        console.error("Get intern by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching intern details"
        });
    }
};

/**
 * @desc    Approve an intern
 * @route   PATCH /api/admin/interns/:id/approve
 * @access  Private (Admin)
 */
const approveIntern = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        // Find intern
        const intern = await Intern.findById(id);
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        // Update fields for approval
        intern.status = "approved";
        intern.approvedAt = new Date();
        intern.approvedBy = req.admin._id;
        intern.rejectionReason = ""; // Clear rejection reason if any
        intern.rejectedAt = null;

        const updatedIntern = await intern.save();

        return res.status(200).json({
            success: true,
            message: "Intern approved successfully",
            data: updatedIntern
        });
    } catch (error) {
        console.error("Approve intern error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while approving intern"
        });
    }
};

/**
 * @desc    Reject an intern
 * @route   PATCH /api/admin/interns/:id/reject
 * @access  Private (Admin)
 */
const rejectIntern = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        // Find intern
        const intern = await Intern.findById(id);
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        // Update fields for rejection
        intern.status = "rejected";
        intern.rejectionReason = reason || "";
        intern.rejectedAt = new Date();
        intern.approvedAt = null;
        intern.approvedBy = null;

        const updatedIntern = await intern.save();

        return res.status(200).json({
            success: true,
            message: "Intern rejected successfully",
            data: updatedIntern
        });
    } catch (error) {
        console.error("Reject intern error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while rejecting intern"
        });
    }
};

/**
 * @desc    Delete an intern
 * @route   DELETE /api/admin/interns/:id
 * @access  Private (Admin)
 */
const deleteIntern = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        const intern = await Intern.findByIdAndDelete(id);
        if (!intern) {
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Intern deleted successfully",
            data: null
        });
    } catch (error) {
        console.error("Delete intern error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting intern"
        });
    }
};

module.exports = {
    loginAdmin,
    getAllInterns,
    getPendingInterns,
    getApprovedInterns,
    getRejectedInterns,
    getInternById,
    approveIntern,
    rejectIntern,
    deleteIntern
};
