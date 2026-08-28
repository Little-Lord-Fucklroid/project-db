import { openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";

// Regex to match and remove emojis from AI responses
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F700}-\u{1F77F}]|[\u{2B00}-\u{2BFF}]|[\u{1F170}-\u{1F1FF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{1F200}]|[\u{1F210}-\u{1F232}]|[\u{1F234}-\u{1F237}]|[\u{1F239}-\u{1F23B}]|[\u{1F250}]|[\u{1F261}-\u{1F265}]|[\u{1F300}-\u{1F320}]|[\u{1F321}]|[\u{1F322}-\u{1F335}]|[\u{1F336}-\u{1F373}]|[\u{1F374}-\u{1F378}]|[\u{1F379}-\u{1F3EC}]|[\u{1F3ED}-\u{1F3F0}]|[\u{1F3F1}-\u{1F3F3}]|[\u{1F3F4}]|[\u{1F3F5}-\u{1F3FF}]|[\u{1F400}-\u{1F4FD}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F53E}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]/gu;

function stripEmojis(text: string): string {
  const stripped = text.replace(EMOJI_REGEX, "");
  // Clean up any doubled spaces left behind by removed emojis
  return stripped.replace(/\s{2,}/g, " ").trim();
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