---
name: save-md
description: Save your last response to a markdown file. Use when the user runs /save-md or asks to save, export or write your previous answer to a .md file.
argument-hint: "[path]"
---

Save the last response you sent before this request to a markdown file. Same as pi's `/save-md`.

1. Take your most recent assistant message before this request, skipping this one. Copy it
   **verbatim**: same markdown, headings, lists, tables and code blocks. Don't summarize,
   reword, shorten or add anything, and leave out tool calls and their output.
2. Path: `$ARGUMENTS` if given, relative to the current directory unless absolute. Otherwise
   `claude-response-<UTC timestamp, like 2026-11-24T10-15-00Z>.md` in the current directory.
   Create missing folders. Don't overwrite an existing file without asking.
3. Write it with the Write tool, ending with one newline.
4. Reply with only the path you wrote. If there is no earlier response, say so and write nothing.
