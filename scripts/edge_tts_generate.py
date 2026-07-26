import asyncio
import json
import sys
import edge_tts

async def main():
    raw = sys.stdin.read()
    if not raw:
        print("No input received", file=sys.stderr)
        sys.exit(1)

    data = json.loads(raw)
    text = data.get("text", "").strip()
    output_path = data.get("output_path", "").strip()
    voice = data.get("voice", "en-US-AvaNeural")  # must use this
    rate = data.get("rate", "-8%")
    pitch = data.get("pitch", "-2Hz")

    if not text or not output_path:
        print("Missing text or output path", file=sys.stderr)
        sys.exit(1)

    # Debug: log the voice being used
    print(f"🔊 Python using voice: {voice}", file=sys.stderr)

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
    )
    await communicate.save(output_path)

if __name__ == "__main__":
    asyncio.run(main())