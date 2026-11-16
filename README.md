# makefun-frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/blybloo/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/blybloo/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only make.fun frontend: the live bounty board with each bounty's live pot, entry fee, time left and entries; a bounty's page with its rewards table, rules and recent entries; its leaderboard; and an account's public profile. Static files, no build step, no sign-in, no writes — it reads make.fun's public API alone, caches answers and revalidates them with ETags, paginates long lists, and lazy-loads each view so the first load stays small.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Any static server with `app/` at its root works.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
