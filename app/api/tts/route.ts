import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export const runtime = "nodejs";

const DEFAULT_VOICE = "en-US-AvaNeural";
const RATE = "-8%";
const PITCH = "-2Hz";

function tryPythonScript(cmd: string, scriptPath: string, payload: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let errorOutput = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("TTS timed out."));
    }, 45000);

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
      reject(new Error(errorOutput || `TTS process exited with code ${code}`));
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function runPythonTts({
  text,
  outputPath,
  voice,
}: {
  text: string;
  outputPath: string;
  voice: string;
}): Promise<void> {
  const scriptPath = path.join(process.cwd(), "scripts", "edge_tts_generate.py");

  if (!existsSync(scriptPath)) {
    throw new Error("Missing edge_tts_generate.py script.");
  }

  const pythonPaths = [
    process.env.PYTHON_BIN,
    process.env.VERCEL ? "python" : "python3",
    "python3",
    "python",
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    "/usr/bin/python",
    "/var/lang/bin/python3",
    "/var/lang/bin/python",
  ].filter((p): p is string => !!p && p.length > 0);

  const payload = {
    text,
    output_path: outputPath,
    voice,
    rate: RATE,
    pitch: PITCH,
  };

  let lastError: Error | null = null;
  for (const cmd of pythonPaths) {
    try {
      await tryPythonScript(cmd, scriptPath, payload);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error("No Python binary found for TTS.");
}

export async function POST(req: Request) {
  let outputPath = "";
  try {
    const body = await req.json();
    const isPrewarm = body.prewarm === true;
    if (isPrewarm) {
      return new Response(null, { status: 204 });
    }

    let text = String(body.text || "").trim();
    const voice = String(body.voice || DEFAULT_VOICE);

    if (!text) {
      return Response.json({ error: "Missing text." }, { status: 400 });
    }
    if (text.length > 1200) {
      text = text.slice(0, 1200);
    }

    outputPath = path.join(os.tmpdir(), `vibe-tts-${randomUUID()}.mp3`);

    await runPythonTts({ text, outputPath, voice });

    const audioBuffer = await fs.readFile(outputPath);
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "TTS failed." },
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
