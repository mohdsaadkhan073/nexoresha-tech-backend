const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin.routes");
const internRoutes = require("./routes/intern.routes");
const app = express();

connectDB().catch(err => console.log("DB Connection Failed: ", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/admin", adminRoutes);
app.use("/api/intern", internRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`)
});
