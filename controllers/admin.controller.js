const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const Intern = require("../models/intern.model");
const generateToken = require("../utils/generateToken");

/**
 * @desc    Admin login to get token
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[${new Date().toISOString()}] Login attempt for email: ${email}`);

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
            console.log(`[${new Date().toISOString()}] Login failed: email ${email} not found`);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 3. Compare password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.log(`[${new Date().toISOString()}] Login failed: incorrect password for email ${email}`);
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Generate token (includes tokenVersion for secure logout)
        const token = generateToken(admin._id, admin.email, admin.tokenVersion);
        console.log(`[${new Date().toISOString()}] Admin ${admin.email} logged in successfully.`);

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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested all interns.`);
        const interns = await Intern.find().sort({ createdAt: -1 });
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully retrieved ${interns.length} interns.`);
        return res.status(200).json({
            success: true,
            message: "Interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Get all interns error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested pending interns.`);
        const interns = await Intern.find({ status: "pending" }).sort({ createdAt: -1 });
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully retrieved ${interns.length} pending interns.`);
        return res.status(200).json({
            success: true,
            message: "Pending interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Get pending interns error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested approved interns.`);
        const interns = await Intern.find({ status: "approved" }).sort({ createdAt: -1 });
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully retrieved ${interns.length} approved interns.`);
        return res.status(200).json({
            success: true,
            message: "Approved interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Get approved interns error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested rejected interns.`);
        const interns = await Intern.find({ status: "rejected" }).sort({ createdAt: -1 });
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully retrieved ${interns.length} rejected interns.`);
        return res.status(200).json({
            success: true,
            message: "Rejected interns retrieved successfully",
            data: interns
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Get rejected interns error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested intern details for ID: ${id}`);

        // Validate ObjectId to prevent CastError/Server crash
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} provided invalid intern ID format: ${id}`);
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        const intern = await Intern.findById(id).populate("approvedBy", "name email");
        if (!intern) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested intern ID: ${id} - Not Found`);
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully retrieved details for intern: ${intern.name} (${id})`);
        return res.status(200).json({
            success: true,
            message: "Intern details retrieved successfully",
            data: intern
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Get intern by ID error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested approval for intern ID: ${id}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} provided invalid ID format for approval: ${id}`);
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        // Find intern
        const intern = await Intern.findById(id);
        if (!intern) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} failed to approve: intern ID ${id} not found`);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully approved intern: ${intern.name} (${id})`);

        return res.status(200).json({
            success: true,
            message: "Intern approved successfully",
            data: updatedIntern
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Approve intern error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested rejection for intern ID: ${id}. Reason: ${reason || "None"}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} provided invalid ID format for rejection: ${id}`);
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        // Find intern
        const intern = await Intern.findById(id);
        if (!intern) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} failed to reject: intern ID ${id} not found`);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully rejected intern: ${intern.name} (${id})`);

        return res.status(200).json({
            success: true,
            message: "Intern rejected successfully",
            data: updatedIntern
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Reject intern error:`, error);
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
        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} requested deletion for intern ID: ${id}`);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} provided invalid ID format for deletion: ${id}`);
            return res.status(400).json({
                success: false,
                message: "Invalid intern ID format"
            });
        }

        const intern = await Intern.findByIdAndDelete(id);
        if (!intern) {
            console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} failed to delete: intern ID ${id} not found`);
            return res.status(404).json({
                success: false,
                message: "Intern not found"
            });
        }

        console.log(`[${new Date().toISOString()}] Admin ${req.admin.email} successfully deleted intern ID: ${id}`);
        return res.status(200).json({
            success: true,
            message: "Intern deleted successfully",
            data: null
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Delete intern error:`, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting intern"
        });
    }
};

/**
 * @desc    Admin logout (invalidates token via versioning)
 * @route   POST /api/admin/logout
 * @access  Private (Admin)
 */
const logoutAdmin = async (req, res) => {
    try {
        const admin = req.admin;
        // Increment token version in database to invalidate current tokens
        admin.tokenVersion = (admin.tokenVersion || 0) + 1;
        await admin.save();

        console.log(`[${new Date().toISOString()}] Admin ${admin.email} logged out successfully. Token version incremented to ${admin.tokenVersion}.`);

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Logout error:`, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout"
        });
    }
};

module.exports = {
    loginAdmin,
    logoutAdmin,
    getAllInterns,
    getPendingInterns,
    getApprovedInterns,
    getRejectedInterns,
    getInternById,
    approveIntern,
    rejectIntern,
    deleteIntern
};
