// scripts/upload-gcs.ts
// Uploads Morphic stills + clips to GCS bucket for frontend consumption.
// Usage: node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs scripts/upload-gcs.ts

import { Storage } from "@google-cloud/storage";
import { readdirSync, statSync } from "fs";
import { join, basename } from "path";

const BUCKET_NAME = "liminal-sin-assets";
const STILLS_DIR = join(__dirname, "..", "assets", "generated_stills");
const CLIPS_DIR = join(__dirname, "..", "assets", "generated_clips");

async function main() {
  const storage = new Storage();

  // Create bucket if it doesn't exist (legacy ACLs = creator gets OWNER)
  try {
    const [exists] = await storage.bucket(BUCKET_NAME).exists();
    if (!exists) {
      console.log(`Creating bucket gs://${BUCKET_NAME}...`);
      await storage.createBucket(BUCKET_NAME, { location: "US-WEST1" });
      console.log("Bucket created.");
    }
  } catch (err: unknown) {
    // 403 on exists() check is fine — might mean bucket exists but we can't read metadata
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("409") && !msg.includes("already own it")) {
      console.log(`Bucket check: ${msg}`);
    }
  }

  const bucket = storage.bucket(BUCKET_NAME);

  // Make objects public via default ACL (not bucket-level IAM)
  try {
    await bucket.makePublic();
    console.log("Bucket made public.");
  } catch {
    console.log("(Public access may already be set or restricted by org policy)");
  }

  // Upload stills
  const stills = readdirSync(STILLS_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\nUploading ${stills.length} stills...`);
  for (const file of stills) {
    const dest = `stills/${file}`;
    const localPath = join(STILLS_DIR, file);
    const size = (statSync(localPath).size / 1024).toFixed(0);
    try {
      await bucket.upload(localPath, { destination: dest, contentType: "image/png" });
      console.log(`  [OK] ${dest} (${size}KB)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${dest}: ${msg}`);
    }
  }

  // Upload clips
  const clips = readdirSync(CLIPS_DIR).filter((f) => f.endsWith(".mp4"));
  console.log(`\nUploading ${clips.length} clips...`);
  for (const file of clips) {
    const dest = `clips/${file}`;
    const localPath = join(CLIPS_DIR, file);
    const sizeMB = (statSync(localPath).size / (1024 * 1024)).toFixed(1);
    try {
      await bucket.upload(localPath, { destination: dest, contentType: "video/mp4" });
      console.log(`  [OK] ${dest} (${sizeMB}MB)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${dest}: ${msg}`);
    }
  }

  // Verify public URLs
  console.log(`\nBase URL: https://storage.googleapis.com/${BUCKET_NAME}/`);
  console.log(`  Still: https://storage.googleapis.com/${BUCKET_NAME}/stills/tunnel_darkness_01.png`);
  console.log(`  Clip:  https://storage.googleapis.com/${BUCKET_NAME}/clips/tunnel_darkness_01.mp4`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
