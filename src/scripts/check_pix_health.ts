import { pixProviderHealth } from "@/lib/pix";

async function check() {
  try {
    const health = await pixProviderHealth();
    console.log("Pix Health Check:", health);
  } catch (e) {
    console.error("Erro ao checar saúde do Pix:", e);
  }
}

check();
