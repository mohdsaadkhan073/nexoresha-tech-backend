const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const internRoutes = require("./routes/intern.routes");

dotenv.config();
const app = express();

// Connect to Database
connectDB().catch(err => console.log("DB Connection Failed: ", err));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded documents
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount intern routes
app.use("/api/interns", internRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Intern Service Running on Port ${PORT}`);
});
