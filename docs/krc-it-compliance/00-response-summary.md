# KRC Pune — Response to KRC IT Team Information Request

**Product:** KRC Pune — VR / Amenities Sales Experience Application
**Vendor:** Fute Services
**Document date:** 16 July 2026
**Prepared by:** _[Name, Title]_ — Fute Services
**Status:** DRAFT — pending vendor sign-off before release to KRC

---

## 1. Executive summary

KRC Pune is a **standalone, fully offline Microsoft Windows desktop application**
(Electron + React), distributed as an NSIS installer (`.exe`) and installed on
sales-lounge / presentation machines.

The single most important fact for this assessment:

> **The application has no backend, no API, no database, no user accounts, and no
> network communication of any kind at runtime.** All content — 360° panoramas,
> floor plans, videos, brochures and inventory data — is bundled inside the
> installer and read from the local disk.

This has been verified against the **compiled production bundle**, not only the
source. See §4 for the evidence.

Because of this architecture, several of the requested items are **not
applicable** rather than outstanding. Each is answered individually below with
the reasoning stated, so KRC IT can confirm or challenge the conclusion.

---

## 2. Point-by-point response

| # | KRC IT request | Response | Reference |
|---|---|---|---|
| 1 | Network architecture diagram | **Provided** | [`01-network-architecture.md`](01-network-architecture.md) |
| 2 | Data / information flow diagram | **Provided** | [`02-data-flow.md`](02-data-flow.md) |
| 3 | Mobile app VAPT report | **Not applicable** — no mobile application exists | [`03-security-scope.md`](03-security-scope.md) §2 |
| 4 | Mobile app source code review report | **Not applicable** — no mobile application exists | [`03-security-scope.md`](03-security-scope.md) §2 |
| 5 | API VAPT report | **Not applicable** — product ships no API and makes no API calls | [`03-security-scope.md`](03-security-scope.md) §3 |
| 6 | Project manager SPOC | **Action on Fute Services** — to be filled in | §3 below |
| 7 | NDA (POC) & MSA (vendor) with KRC | **Action on Fute Services / Legal** | §3 below |

---

## 3. Open items — action on Fute Services

These two items **cannot be produced from the codebase** and must be completed by
the business before this pack is sent to KRC.

### 6. Project manager SPOC

To be confirmed and inserted by Fute Services management:

| Field | Value |
|---|---|
| Name | _[To be filled]_ |
| Designation | _[To be filled]_ |
| Email | _[To be filled]_ |
| Phone | _[To be filled]_ |
| Escalation contact (L2) | _[To be filled]_ |
| Working hours / timezone | _[To be filled]_ |

### 7. NDA & MSA

These are **legal instruments** and are deliberately not drafted here. Route to
the Fute Services legal / contracts owner:

- **NDA** — required if the engagement is a POC.
- **MSA** — required if Fute Services is an onboarded vendor.

Confirm with KRC's procurement team whether an NDA/MSA is **already executed**
between Fute Services and K Raheja Corp under an existing vendor relationship; if
so, share the executed copy and reference number rather than signing a new one.

> ⚠️ Do not send this pack to KRC until items 6 and 7 are resolved and the
> security scope statement (§4 / `03-security-scope.md`) has been reviewed and
> signed off by a Fute Services owner. The technical content is factual as of the
> commit noted below, but it is a **vendor self-declaration**, not a third-party
> certification.

---

## 4. Basis of assessment (how these facts were established)

The technical statements in this pack are derived from direct inspection of the
repository and the production build, not from documentation or recollection:

| Check | Method | Result |
|---|---|---|
| External network calls in shipped app | Scanned compiled bundle (`code/dist/assets/`) for `http(s)://` hosts | **No external service hosts.** Only library documentation URLs (`react.dev`, `reactrouter.com`, `mui.com`) inside vendor code comments/error strings |
| Data source | Traced all shipped pages' data imports | All read `src/data/offlineApi.ts`, which imports static local JSON |
| Dead vs. live code | Static import-reachability trace from entry point `src/main.tsx` | Only **46 of 96** code files are reachable. All backend-referencing modules are unreachable and never bundled — see [`03-security-scope.md`](03-security-scope.md) §3.1 |
| 360° VR viewer | `code/dist/index.html` | Pannellum vendored locally (`./vendor/pannellum.js`) — not a CDN |
| Map | `src/pages/Location/MapboxMap.tsx` | Despite the filename, **no Mapbox SDK**. Renders a bundled local `.mp4` with static image markers |
| Local data storage | Grep for `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie` | **None** |
| User input / PII capture | Grep for `<form>`, `<input>`, `onSubmit` across shipped pages | **None** |
| Telemetry / analytics | Grep for `analytics`, `gtag`, `sentry`, `telemetry` | **None** |
| Electron hardening | `code/electron/main.cjs` | `contextIsolation: true`, `nodeIntegration: false`, no-op preload |

**Repository:** `https://github.com/Fute-Services/krpune`
**Assessed at commit:** `5876920` (branch `main`)

Any material change to the above — in particular **re-enabling a live backend** —
invalidates this pack and requires it to be reissued. See
[`03-security-scope.md`](03-security-scope.md) §3 for why this caveat matters.
