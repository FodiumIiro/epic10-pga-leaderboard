import fs from "node:fs";
import path from "node:path";
import { ApiResponse } from "./types";

const FINAL_SCORES_PATH = path.join(process.cwd(), "data", "final-scores.json");

let cached: ApiResponse | null | undefined;

export function readFinalSnapshot(): ApiResponse | null {
  if (cached !== undefined) return cached;

  try {
    const raw = fs.readFileSync(FINAL_SCORES_PATH, "utf-8");
    cached = JSON.parse(raw) as ApiResponse;
    return cached;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      cached = null;
      return null;
    }
    throw error;
  }
}
