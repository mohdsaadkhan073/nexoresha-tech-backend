const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuth.middleware");
const {
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
} = require("../controllers/admin.controller");

// --- Public Routes ---
router.post("/login", loginAdmin);

// --- Protected Routes (All require admin authentication middleware) ---
router.post("/logout", adminAuth, logoutAdmin);
router.get("/interns", adminAuth, getAllInterns);
router.get("/interns/pending", adminAuth, getPendingInterns);
router.get("/interns/approved", adminAuth, getApprovedInterns);
router.get("/interns/rejected", adminAuth, getRejectedInterns);
router.get("/interns/:id", adminAuth, getInternById);
router.patch("/interns/:id/approve", adminAuth, approveIntern);
router.patch("/interns/:id/reject", adminAuth, rejectIntern);
router.delete("/interns/:id", adminAuth, deleteIntern);

module.exports = router;
