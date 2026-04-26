async function test() {
  try {
    const res1 = await fetch("http://localhost:5000/api/search?q=chirag&type=users");
    const data1 = await res1.json().catch(() => ({ error: "not json", status: res1.status }));
    console.log("/api/search response:", data1);
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
