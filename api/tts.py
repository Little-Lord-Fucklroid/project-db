from http.server import BaseHTTPRequestHandler
import asyncio
import json
import os
import tempfile

import edge_tts


DEFAULT_VOICE = "en-US-AvaNeural"
RATE = "-8%"
PITCH = "-2Hz"


async def create_speech_file(text: str, output_path: str, voice: str = DEFAULT_VOICE):
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=RATE,
        pitch=PITCH,
    )

    await communicate.save(output_path)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        temp_path = ""

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)

            body = json.loads(raw_body.decode("utf-8"))
            text = str(body.get("text", "")).strip()
            voice = str(body.get("voice", DEFAULT_VOICE)).strip()

            if not text:
                self.send_json_error(400, "Missing text.")
                return

            if len(text) > 1200:
                text = text[:1200]

            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=".mp3",
            )

            temp_path = temp_file.name
            temp_file.close()

            asyncio.run(create_speech_file(text, temp_path, voice))

            with open(temp_path, "rb") as audio_file:
                audio_bytes = audio_file.read()

            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(audio_bytes)))
            self.end_headers()
            self.wfile.write(audio_bytes)

        except Exception as error:
            print("TTS error:", error)
            self.send_json_error(500, "TTS failed.")

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    def send_json_error(self, status_code: int, message: str):
        payload = json.dumps({"error": message}).encode("utf-8")

        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)