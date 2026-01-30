import dotenv from "dotenv";
import OpenAI from "openai";

// Explicitly load .env.local
dotenv.config({ path: ".env.local" });

console.log(
  "OPENAI_API_KEY exists?",
  process.env.OPENAI_API_KEY ? "YES ✅" : "NO ❌"
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runTest() {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a friendly 11+ tutor." },
      { role: "user", content: "Explain algebra to an 11-year-old." }
    ],
  });

  console.log("OpenAI says:", response.choices[0].message.content);
}

runTest().catch(console.error);
