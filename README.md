# RecallRadar

Consumer safety intelligence — search food, drug, and medical device recalls.

## Deploy to Vercel (free, ~3 minutes)

### Step 1 — Push to GitHub
```bash
cd recallradar
git init
git add .
git commit -m "Initial commit"
```
Then create a new repo at https://github.com/new and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/recallradar.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to https://vercel.com and sign up (free) with your GitHub account
2. Click **Add New → Project**
3. Import your `recallradar` GitHub repo
4. Leave all settings as default — Vercel auto-detects Vite
5. Click **Deploy**

That's it. Your app will be live at `recallradar.vercel.app` in ~60 seconds.

### Step 3 — Every future update
```bash
git add .
git commit -m "Your change"
git push
```
Vercel auto-deploys on every push. No manual steps.

## Local development
```bash
npm install
npm run dev
```

## Tech stack
- React 18 + Vite
- Framer Motion (animations)
- React Three Fiber + Drei (3D hero)
- openFDA public API (no key needed)
- SheetBest (waitlist email capture)
- Vercel (hosting, free tier)

## Bugs fixed in this version
- Stale closure bug in useEffect (searchRecalls now uses useCallback)
- Non-ok API responses handled gracefully (404 = no results, not an error)
- Network errors distinguished from logic errors
- Share URL now includes category param
- Search button disabled while loading
- Enter key works in email input on modal
