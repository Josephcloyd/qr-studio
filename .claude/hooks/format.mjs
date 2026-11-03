// PostToolUse hook: format files Claude edits with the project's Prettier.
// Reads the hook payload from stdin; never fails the tool call.
import { spawnSync } from "node:child_process";

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input || "{}");
    const file = payload?.tool_input?.file_path;
    if (
      typeof file !== "string" ||
      !/\.(ts|tsx|js|mjs|css|json|md)$/.test(file) ||
      /node_modules|[\\/]out[\\/]|\.next/.test(file)
    )
      return;
    spawnSync(
      process.execPath,
      ["node_modules/prettier/bin/prettier.cjs", "--write", "--log-level", "silent", file],
      {
        cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
        stdio: "ignore",
      },
    );
  } catch {
    // Formatting is best-effort; never block the edit.
  }
});
