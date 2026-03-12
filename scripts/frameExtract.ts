import { readFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

/**
 * Extracts the final visible frame from an MP4 using ffmpeg.
 * Requires ffmpeg in PATH.
 */
export async function extractLastFrame(videoPath: string): Promise<Buffer> {
  const outPath = join(
    dirname(videoPath),
    `${videoPath.split(/[\\/]/).pop() ?? "video"}.last-frame.jpg`,
  );

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-sseof",
        "-0.10",
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        outPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (err) => {
      reject(
        new Error(
          `Failed to execute ffmpeg for last-frame extraction: ${err.message}`,
        ),
      );
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `ffmpeg exited with code ${code} while extracting last frame from ${videoPath}. ${stderr.trim()}`,
        ),
      );
    });
  });

  try {
    return readFileSync(outPath);
  } finally {
    rmSync(outPath, { force: true });
  }
}
