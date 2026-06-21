const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin.routes");
const app = express();

connectDB().catch(err => console.log("DB Connection Failed: ", err));

app.use(express.json());

// Mount admin routes
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`)
});
