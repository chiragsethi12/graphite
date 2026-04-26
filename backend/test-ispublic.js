import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import("./models/User.model.js")).default;
  const user = await User.findOne({ name: { $regex: "chirag", $options: "i" } });
  console.log("isPublic:", user.isPublic);
  process.exit(0);
}
checkUser();
