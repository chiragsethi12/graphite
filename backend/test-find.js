import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function checkFind() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import("./models/User.model.js")).default;
  const user = await User.collection.findOne({ name: { $regex: "chirag", $options: "i" } });
  
  console.log("Raw user from MongoDB:", user.isPublic);
  
  process.exit(0);
}
checkFind();
