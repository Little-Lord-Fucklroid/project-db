import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export const runtime = "nodejs";

const VOICE = "en-US-AvaNeural";
const RATE = "-8%";
const PITCH = "-2Hz";

function runPythonTts({
  text,
  outputPath,
}: {
  text: string;
  outputPath: string;
}) {
  return new Promise<void>((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "edge_tts_generate.py"
    );

    if (!existsSync(scriptPath)) {
      reject(new Error("Missing edge_tts_generate.py script."));
      return;
    }

    const pythonCommand =
      process.env.PYTHON_BIN || "python3";

    const child = spawn(pythonCommand, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let errorOutput = "";

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("TTS timed out."));
    }, 25000);

    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          errorOutput || `TTS process exited with code ${code}`
        )
      );
    });

    child.stdin.write(
      JSON.stringify({
        text,
        output_path: outputPath,
        voice: VOICE,
        rate: RATE,
        pitch: PITCH,
      })
    );

    child.stdin.end();
  });
}

export async function POST(req: Request) {
  let outputPath = "";

  try {
    const body = await req.json();
    const isPrewarm = body.prewarm === true;

    // If prewarm, return immediately without generating audio
    if (isPrewarm) {
      return new Response(null, { status: 204 });
    }

    let text = String(body.text || "").trim();

    if (!text) {
      return Response.json(
        { error: "Missing text." },
        { status: 400 }
      );
    }

    if (text.length > 1200) {
      text = text.slice(0, 1200);
    }

    outputPath = path.join(
      os.tmpdir(),
      `vibe-tts-${randomUUID()}.mp3`
    );

    await runPythonTts({
      text,
      outputPath,
    });

    const audioBuffer = await fs.readFile(outputPath);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Ava TTS route failed:", error);

    return Response.json(
      { error: "TTS failed." },
      { status: 500 }
    );
  } finally {
    if (outputPath) {
      try {
        await fs.unlink(outputPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}