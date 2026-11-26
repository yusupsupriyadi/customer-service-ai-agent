import { connection } from "next/server";
import { env } from "@/lib/server";

// Hanya memberi tahu key mana yang sudah diisi, tanpa isi key-nya.
export async function GET() {
  await connection();
  return Response.json({ netra: Boolean(env.netraKey), deepgram: Boolean(env.deepgramKey) });
}
