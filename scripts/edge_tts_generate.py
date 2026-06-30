import asyncio
import json
import sys

import edge_tts


async def main():
    raw_input = sys.stdin.read()
    data = json.loads(raw_input)

    text = str(data.get("text", "")).strip()
    output_path = str(data.get("output_path", "")).strip()

    voice = str(data.get("voice", "en-US-AvaNeural"))
    rate = str(data.get("rate", "-8%"))
    pitch = str(data.get("pitch", "-2Hz"))

    if not text:
        raise ValueError("Missing text.")

    if not output_path:
        raise ValueError("Missing output path.")

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch,
    )

    await communicate.save(output_path)


if __name__ == "__main__":
    asyncio.run(main())