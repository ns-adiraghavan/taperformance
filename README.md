# TA Performance Dashboard

Internal TA dashboard for Netscribes — Cut 1 (requisition-level upload POC).

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Demo login

| Field    | Value                        |
|----------|------------------------------|
| Email    | `rima.ali@netscribes.com`    |
| Password | `Passw0rd`                   |

After login, click **"Load sample data"** to see the dashboard with 80 pre-built requisitions, or upload your own CoEfficient export (CSV or XLSX).

## Upload format

The app accepts any CSV or XLSX with columns matching (case-insensitive, underscores/spaces flexible):

| Column | Description |
|--------|-------------|
| `ID` | Requisition ID |
| `Req_Raised` | Date req was created |
| `HR_Approval_Date` | Date HR head approved |
| `Agreed_TAT` | Agreed closure deadline (date) |
| `Request_DOJ` | Requested date of joining (TAT fallback) |
| `Vacancies` | Number of positions |
| `Status` | Req status |
| `Division` | Business division |
| `Function` | Functional department |
| `Designation` | Role title |
| `Location` | Work location |
| `Requestor` | Person who raised the req |
| `Project` | Project name |
| `TA_Members` | Comma-separated recruiter names |
| `Sourced` | Profiles sourced count |
| `Shortlisted` | Shortlisted count |
| `In_Interview` | In-interview count |
| `Selected` | Final selected count |
| `Offered` | Offered count |
| `Offer_Accepted` | Offer accepted count |
| `Joined` | Joined count |

Dates: `YYYY-MM-DD` or `DD/MM/YYYY` or `DD-Mon-YYYY`.

## Deploy to Vercel

1. Push repo to GitHub
2. Import in [vercel.com](https://vercel.com) → New Project
3. No environment variables needed
4. Deploy

All data lives in the browser (localStorage). Re-deploying does not clear user data.

## Architecture

- **Next.js 14** App Router, client-side only
- **Recharts** for all charts
- **Zustand** (persisted to localStorage) for state
- **SheetJS** for XLSX parsing and Excel export
- **PapaParse** for CSV parsing
- Business-day math: custom implementation, configurable holiday calendar

## Phase 2 notes

All metrics are defined behind a `DataAccessInterface` (`lib/dataAccess.ts`). Cut 1 fulfils this from uploaded snapshots; Phase 2 swaps it for a live CoEfficient query with no view rewrites.

---

*Spec: TA Performance Dashboard v2.2 — Netscribes / Adi Raghavan*
