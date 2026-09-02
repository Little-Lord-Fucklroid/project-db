import { openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";

// Comprehensive regex to match and remove emojis from AI responses
// Covers all Unicode emoji ranges including emoticons, symbols, transport, flags, etc.
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F700}-\u{1F77F}]|[\u{2B00}-\u{2BFF}]|[\u{1F170}-\u{1F1FF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F3FF}]|[\u{1F400}-\u{1F4FF}]|[\u{1F500}-\u{1F5FF}]|[\u{1F600}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{23E9}-\u{23EF}]|[\u{23F0}-\u{23FF}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B00}-\u{2BFF}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

function stripEmojis(text: string): string {
  let stripped = text.replace(EMOJI_REGEX, "");
  // Also remove common emoji-like patterns (e.g., :smile:, :heart:, etc.)
  stripped = stripped.replace(/:[a-z_+-]+:/gi, "");
  // Clean up any doubled spaces left behind by removed emojis
  stripped = stripped.replace(/\s{2,}/g, " ").trim();
  // Clean up spaces before punctuation
  stripped = stripped.replace(/\s+([.,!?;:])/g, "$1");
  return stripped;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const chatHistory = body.messages || [];
    const memories = body.memories || "";

    const memoryPrompt = memories
      ? `

Known memories about the user:
${memories}

Use these memories naturally when relevant. Do not mention that you are reading a memory list.
`
      : "";

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + memoryPrompt,
        },
        ...chatHistory.map((msg: any) => ({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.text,
        })),
      ],
    });

    let reply =
      completion?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't respond.";

    // Strip emojis from the response
    reply = stripEmojis(reply);

    console.log("AI RAW:", completion);
    console.log("AI CLEAN:", reply);

    return Response.json({ reply });
  } catch (error) {
    console.error(error);

    return Response.json(
      { reply: "Something went wrong." },
      { status: 500 }
    );
  }
}