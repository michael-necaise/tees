# Tees

A golf idle game. Make every tee. One screen, three stages, a few hours.

1. **The workshop.** Cut tees, buy wood, set a price, and automate the bench.
2. **The planet.** Drones and factories turn the Earth into tees.
3. **The stars.** Von Neumann caddies use up the universe.

Progress stays in the browser. No account and no database.

## Run it

```bash
npm install
npm run dev
```

Then open the URL the dev server prints.

## Put it on Vercel

1. In Vercel, import this GitHub repo.
2. Leave the install and build commands as they are (`npm run build`).
3. Do not add a database. Deploy.

The production build writes Vercel’s Build Output API (`.vercel/output`).
