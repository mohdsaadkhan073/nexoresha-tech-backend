const express = require("express");
const { registerIntern, loginIntern, getInternStatus } = require("../controllers/intern.controller");
const internAuth = require("../middlewares/internAuth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

// Route for intern registration
router.post(
    "/register",
    upload.fields([
        { name: "collegeIdCard", maxCount: 1 },
        { name: "aadhaarCard", maxCount: 1 }
    ]),
    registerIntern
);

// Route for intern login
router.post("/login", loginIntern);

// Route to get intern status
router.get("/status", internAuth, getInternStatus);

module.exports = router;
