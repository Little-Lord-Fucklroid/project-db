export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    console.log("VOICE TEXT:", text);

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs error:", err);
      return new Response(err, { status: 500 });
    }

    const audio = await response.arrayBuffer();

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    console.error("VOICE ROUTE ERROR:", err);
    return new Response("Server error", { status: 500 });
  }
}
