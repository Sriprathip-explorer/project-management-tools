# Nebula PM — Split Frontend / Backend

## Structure
- `frontend/` — Next.js + Tailwind UI.
- `backend/` — Express API (board, comments) with in-memory demo data.

## Run backend (API on http://localhost:4000)
```bash
cd backend
npm install
npm run dev
```

## Run frontend (UI on http://localhost:3000)
```bash
cd frontend
# set API base (defaults to http://localhost:4000)
set NEXT_PUBLIC_API_BASE=http://localhost:4000   # Windows PowerShell: $env:NEXT_PUBLIC_API_BASE="http://localhost:4000"
npm install
npm run dev
```

## Notes
- Data is in-memory for demo; swap to a real DB/auth layer when ready.
- Frontend expects `NEXT_PUBLIC_API_BASE` to point at the backend.

