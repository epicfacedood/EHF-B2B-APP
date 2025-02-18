import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;

// Simplified server startup without retries
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
