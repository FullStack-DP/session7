require("dotenv").config();
const cors = require("cors");
const express = require("express");
const userRoutes = require("./routes/userRouter");
const connectDB = require("./config/db");
// express app
const app = express();

// middleware
app.use(cors());
app.use(express.json());

connectDB();

// routes
app.use("/api/user", userRoutes);

const port = process.env.PORT || 4000;
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
