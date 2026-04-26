import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import("./models/User.model.js")).default;
  
  const user = await User.findOne({ name: { $regex: "chirag", $options: "i" } });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback", { expiresIn: "30d" });
  
  const res1 = await fetch("http://localhost:5000/api/users/search?q=chirag", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log("users/search:", data1.users?.length);
  
  const res2 = await fetch("http://localhost:5000/api/search?q=chirag&type=users", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data2 = await res2.json();
  console.log("search:", data2.users?.length);
  
  process.exit(0);
}
test();
