import { openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();

const chatHistory = body.messages || [];

const completion = await openai.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...chatHistory.map((msg: any) => ({
      role: msg.role === "ai" ? "assistant" : "user",
      content: msg.text,
    })),
  ],
});

    const reply =
      completion?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't respond.";

    console.log("AI RAW:", completion);

    return Response.json({ reply });
  } catch (error) {
    console.error(error);

    return Response.json(
      { reply: "Something went wrong." },
      { status: 500 }
    );
  }
}