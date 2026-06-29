# How to share NEWSCARD with a friend (e.g. UK)

NEWSCARD runs **on each person's own PC**. Data stays local (SQLite). Your friend does **not** need Python or Node installed if you send the **built app**.

---

## Option A — Send a ready-to-run app (recommended)

### On your PC (one time)

1. Open PowerShell in the project folder:
   ```powershell
   cd C:\Users\hp\Projects\newscard
   py -3.13 build_app.py
   ```
   This takes several minutes. It creates a folder:
   `C:\Users\hp\Projects\newscard\dist\NEWSCARD\`

2. Zip that entire folder:
   - Right-click `dist\NEWSCARD` → **Send to** → **Compressed (zipped) folder**
   - Name it e.g. `NEWSCARD-v2.1.zip`

3. Upload and share the zip (any of these work in the UK too):
   - Google Drive
   - Dropbox
   - WeTransfer
   - OneDrive
   - Email (if under size limit, often ~25 MB)

### What your friend does (Windows)

1. Download and **Extract** the zip (e.g. to `Desktop\NEWSCARD\`)
2. Double-click **`run.bat`**
3. Browser opens at **http://127.0.0.1:8000/** — use the app
4. If Windows SmartScreen warns: **More info** → **Run anyway** (you built it; it's not from the Store)

**Requirements for your friend:**
- Windows 10 or 11 (64-bit)
- No Python/Node needed for Option A

---

## Option B — Share the project folder (for technical friends)

Zip the whole project **except** `node_modules` and `frontend\dist` (friend builds once):

```powershell
cd C:\Users\hp\Projects\newscard
.\start.ps1
```

Send instructions:

```powershell
cd newscard
cd frontend
npm install
npm run build
cd ..
py -3.13 run_server.py
```

Open: **http://127.0.0.1:8000/**

Friend needs: **Python 3.13**, **Node.js**, internet for first `npm install`.

---

## Option C — Same data on a USB stick

To copy **your** shop data to your friend:

1. Stop NEWSCARD on your PC
2. Copy folder: `newscard\data\` (contains `newscard.db`)
3. Friend puts it in their `NEWSCARD\data\` after install
4. Friend starts the app

⚠️ Only do this if you trust them with customer addresses/phones (encrypted in DB, but they have the file).

---

## UK-specific notes

- Currency is already **£** in the app — no change needed for UK.
- Works offline after install — no UK server required.
- **GDPR:** If they store UK customer personal data, they are responsible for backups and security on their PC.

---

## If your friend uses a Mac

The Windows `.exe` will **not** run on Mac. They need either:
- A Windows PC, or
- You build on a Mac with the same project (`py build_app.py` on macOS), or
- Option B with Python + Node on their Mac.

---

## Troubleshooting for your friend

| Problem | Fix |
|---------|-----|
| Blank / white page | Hard refresh: **Ctrl+Shift+R** |
| Port in use | Close other NEWSCARD windows; restart `run.bat` |
| Antivirus blocked exe | Allow in antivirus or use Option B |

---

## Share by IP (network / internet)

Right now the app only listens on **your PC** (`127.0.0.1`). To let someone open it in a browser using an **IP address**, pick the case below.

### Same house / same Wi‑Fi (LAN)

**You:** double‑click **`run_lan.bat`** (or set `NEWSCARD_HOST=0.0.0.0` then start the app).

**Find your IP:** PowerShell → `ipconfig` → look for **IPv4** (e.g. `192.168.1.45`).

**Friend (same Wi‑Fi):** open in browser:

`http://192.168.1.45:8000/`  
(use **your** IP, not theirs)

- Works for phone/laptop on the same router.
- Does **not** work from the UK if you are in another country on a different network.

**Security:** There is **no password** on NEWSCARD. Anyone on your Wi‑Fi could use it. Only use on a network you trust.

---

### Friend in the UK (different country) — over the internet

Your home IP alone is usually **not** enough (router firewall, dynamic IP, security). Safer options:

| Method | Difficulty | Notes |
|--------|------------|--------|
| **Send zip** (Option A above) | Easy | Best for most people — they run their own copy |
| **Tailscale** (free VPN) | Medium | You both install Tailscale; friend opens `http://100.x.x.x:8000` — private, no port forwarding |
| **ngrok** | Medium | Temporary public URL; good for demos, not 24/7 shop use |
| **Cloud server** (VPS) | Hard | Install app on DigitalOcean/AWS; real “online” URL; needs setup + security |

**Not recommended without extra security:** opening port 8000 on your router (“port forwarding”) — exposes your PC to the whole internet.

---

### Tailscale example (UK friend, private)

1. You and your friend both install [Tailscale](https://tailscale.com).
2. You run **`run_lan.bat`** (or `set NEWSCARD_HOST=0.0.0.0` + `run_server.py`).
3. In Tailscale, note your PC’s Tailscale IP (e.g. `100.64.12.34`).
4. Friend opens: `http://100.64.12.34:8000/`

Same database on **your** PC — you’re sharing **your** running app, not a separate install.

---

### ngrok example (quick demo link)

1. Install ngrok, run NEWSCARD with `NEWSCARD_HOST=0.0.0.0`.
2. In another terminal: `ngrok http 8000`
3. Send friend the `https://xxxx.ngrok.io` link (changes each time on free plan).

---

## Quick message you can copy to your friend

```
I sent you NEWSCARD (newsagent shop manager).

1. Unzip the folder
2. Double-click run.bat
3. Use the browser page that opens (http://127.0.0.1:8000)

Press F1 for help inside the app.
Your data stays on your PC only.
```
