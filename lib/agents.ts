// Agent = suara Flux Deepgram Bahasa Indonesia + gaya bicara di system prompt.
// Daftar suara: https://developers.deepgram.com/docs/flux-tts/voices
export type Agent = {
  id: string;
  name: string;
  voice: string;
  gender: "Perempuan" | "Laki-laki";
  style: string;
  stylePrompt: string;
  sample: string;
};

export const AGENTS: Agent[] = [
  {
    id: "fitri",
    name: "Fitri",
    voice: "flux-fitri-id",
    gender: "Perempuan",
    style: "Ramah dan santai",
    stylePrompt: "Gaya bicaramu ramah dan santai, seperti kakak yang senang membantu.",
    sample: "Halo Kak, saya Fitri. Ada yang bisa saya bantu hari ini?",
  },
  {
    id: "dewi",
    name: "Dewi",
    voice: "flux-dewi-id",
    gender: "Perempuan",
    style: "Formal dan rapi",
    stylePrompt: "Gaya bicaramu formal, rapi, dan tertata, seperti petugas layanan di kantor bank.",
    sample: "Selamat datang, saya Dewi. Silakan sampaikan keperluan Kakak.",
  },
  {
    id: "fajar",
    name: "Fajar",
    voice: "flux-fajar-id",
    gender: "Laki-laki",
    style: "Singkat dan cekatan",
    stylePrompt: "Gaya bicaramu singkat dan cekatan: langsung ke jawaban tanpa basa-basi panjang.",
    sample: "Halo Kak, Fajar di sini. Mau tanya apa?",
  },
  {
    id: "rizky",
    name: "Rizky",
    voice: "flux-rizky-id",
    gender: "Laki-laki",
    style: "Akrab gaya anak muda",
    stylePrompt: "Gaya bicaramu akrab dan ceria seperti anak muda, tetap sopan.",
    sample: "Hai Kak, aku Rizky! Ada yang bisa aku bantu nih?",
  },
  {
    id: "teguh",
    name: "Teguh",
    voice: "flux-teguh-id",
    gender: "Laki-laki",
    style: "Sabar dan pelan",
    stylePrompt: "Gaya bicaramu sabar dan tenang, menjelaskan pelan-pelan langkah demi langkah.",
    sample: "Selamat siang Kak, dengan Teguh. Pelan-pelan saja, saya bantu.",
  },
];

export const DEFAULT_AGENT_ID = "fitri";

export function findAgent(id: unknown): Agent {
  return AGENTS.find((agent) => agent.id === id) ?? AGENTS[0];
}
