import { sql } from "@/lib/db";

async function auditGifts() {
  console.log("Auditing Gifts for Art Collection...");
  try {
    // Forçando a query como string para evitar erro de template literal no build
    const gifts = await sql("SELECT id, name, description, image_key, category FROM gifts WHERE active = 1 ORDER BY display_order ASC");
    
    console.log(`\nTotal Gifts Found: ${gifts.length}\n`);
    console.log("------------------------------------------------------------------------------------------------------------------");
    console.log(`${"ID".padEnd(5)} | ${"Image Key".padEnd(20)} | ${"Name".padEnd(30)} | ${"Category"}`);
    console.log("------------------------------------------------------------------------------------------------------------------");
    
    gifts.forEach(g => {
      console.log(`${String(g.id).padEnd(5)} | ${(g.image_key || "default").padEnd(20)} | ${g.name.padEnd(30)} | ${g.category}`);
    });
    console.log("------------------------------------------------------------------------------------------------------------------");
  } catch (e) {
    console.error("Error auditing gifts:", e);
  }
}

auditGifts();

