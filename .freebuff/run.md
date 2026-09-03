# Schollective — Preview Run Doc

## Reproduce artifacts

1. **Dependencies** — `npm install` (already installed in this worktree).
2. **`.env.local`** — Copy from the main checkout at `/Users/bnjw/Documents/Projects/Schollective/.env.local` into this worktree's root.

## Run the dev server

Port 3000 is occupied on this machine by another project (`research-visualization`),
so use **3100**. `screen` sessions are reaped in this environment, so detach via
`launchctl submit` instead — and note launchd's default PATH has no Homebrew, so
`export PATH` inside the shell or `npm`/`node` are not found (exit 127):

```bash
label=schollective-preview-c275feab
launchctl remove "$label" 2>/dev/null || true
launchctl submit -l "$label" -- /bin/sh -c 'export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin; cd /Users/bnjw/Documents/Projects/Schollective && exec npm run dev -- -p 3100 > /Users/bnjw/Documents/Projects/Schollective/.freebuff/preview-c275feab-5ee7-4e73-87b0-c5c729d99ef8.log 2>&1'
```

Wait ~10-15s, then verify:

```bash
lsof -n -P -iTCP:3100 -sTCP:LISTEN          # server pid (register this in Preview)
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3100/
```

**Port used:** 3100
**launchd label:** `schollective-preview-c275feab`
**To stop:** `launchctl remove schollective-preview-c275feab`
