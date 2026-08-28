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
      model: "openai/gpt-oss-120b",
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

    const emojiRegex =
    /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2702}-\u{27B0}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F700}-\u{1F77F}]|[\u{2B00}-\u{2BFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{1F200}]|[\u{1F250}]|[\u{1F300}-\u{1F320}]|[\u{1F3ED}-\u{1F3F0}]|[\u{1F400}-\u{1F4FD}]|[\u{1F53E}-\u{1F5FF}]/gu;

    let summary =
      completion.choices[0].message.content?.trim() ||
      existingSummary;

    // Strip emojis from the summary
    summary = summary.replace(emojiRegex, "").trim();

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