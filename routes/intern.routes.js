const express = require("express");
const { registerIntern } = require("../controllers/intern.controller");
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

module.exports = router;
