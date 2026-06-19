import { openai } from "@/lib/openai";

type Message = {
  role: "user" | "ai";
  text: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const existingSummary = body.existingSummary || "";
    const messages: Message[] = body.messages || [];

    if (!messages.length) {
      return Response.json({
        summary: existingSummary,
      });
    }

    const chatText = messages
      .map((message) => {
        return `${message.role.toUpperCase()}: ${message.text}`;
      })
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You update a long-term private context summary for an AI companion app.

Your job:
- Keep important long-term context about the user.
- Keep emotional patterns, relationships, preferences, fears, goals, projects, and recurring problems.
- Include important details from the new chat.
- Keep the summary concise but useful.
- Do not write fake details.
- Do not include unnecessary small talk.
- Do not mention that this is a summary.
- Write in third person using "The user".

Return only the updated summary text.
          `.trim(),
        },
        {
          role: "user",
          content: `
Existing summary:
${existingSummary || "No existing summary yet."}

New chat messages:
${chatText}

Update the user's long-term context summary.
          `.trim(),
        },
      ],
      temperature: 0.3,
    });

    const summary =
      completion.choices[0].message.content?.trim() ||
      existingSummary;

    return Response.json({
      summary,
    });
  } catch (error) {
    console.error("Summarize error:", error);

    return Response.json(
      {
        error: "Failed to summarize chat.",
      },
      {
        status: 500,
      }
    );
  }
}