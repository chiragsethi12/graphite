import axios from "axios";

async function testController() {
  // Let's modify the controller temporarily to add logs, or just fetch and see
  const res = await fetch("http://localhost:5000/api/users/search?q=chirag");
  console.log(await res.text());
}
testController();
