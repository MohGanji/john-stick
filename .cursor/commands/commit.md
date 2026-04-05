---
description: Stage all changes, commit with a brief message, push to origin main
---

Execute the following **in the git repo root** using the terminal, in order:

1. `git add -A`
2. `git commit -m "<message>"` — message = **very brief** imperative summary of what was done (one short phrase; same spirit as a one-line conventional subject).
3. `git push origin main`

Rules:

- If `git status` shows **no changes** to commit after add, **do not** create an empty commit; say there was nothing to commit and **do not** push.
- If commit fails (e.g. nothing staged), stop and report.
- If push fails (auth, non-fast-forward, wrong branch), report the error and **do not** force-push unless the user explicitly asks.
