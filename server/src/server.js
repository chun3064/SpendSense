require("dotenv").config();

const { connectToDatabase } = require("./config/db");
const app = require("./app");
const PORT = process.env.PORT || 3000;

// Start the server only after MongoDB connects
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
