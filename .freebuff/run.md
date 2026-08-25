# Schollective — Preview Run Doc

## Reproduce artifacts

1. **Dependencies** — `npm install` (already installed in this worktree).
2. **`.env.local`** — Copy from the main checkout at `/Users/bnjw/Documents/Projects/Schollective/.env.local` into this worktree's root.

## Run the dev server

Pick a free port (default 3000). Start the server inside a detached `screen` session so it outlives the conversation:

```bash
screen -dmS schollective-preview npm run dev -- -p <PORT>
```

Wait ~10-15s for Next.js to compile, then verify:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:<PORT>/
```

**Port used:** 3000  
**Screen session:** `schollective-preview`  
**To stop:** `screen -S schollective-preview -X quit`