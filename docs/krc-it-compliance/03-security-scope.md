# 3–5. Security Assessment — Applicability & Scope Statement

**Product:** KRC Pune — VR / Amenities Sales Experience Application
**Vendor:** Fute Services
**Document date:** 16 July 2026
**Assessed at commit:** `5876920` (`main`)

---

> ### ⚠️ Read this first — what this document is and is not
>
> This is a **vendor self-declaration of scope**, plus an **internal secure-code
> review** performed by inspecting the repository.
>
> **It is NOT a VAPT report.** No penetration test, dynamic testing, or
> third-party security assessment has been performed on this product. Fute
> Services must not represent this document as one.
>
> Items 3, 4 and 5 of KRC's request are answered as **Not Applicable** because
> the corresponding assets **do not exist** in this product — not because testing
> was performed and passed.

---

## 1. Scope of the product

| Asset type | Present? | Consequence for KRC's request |
|---|---|---|
| Windows desktop application (Electron) | ✅ Yes | The entire product |
| Mobile application (Android / iOS) | ❌ **No** | Items 3 & 4 are N/A |
| Backend API / server | ❌ **No** | Item 5 is N/A |
| Database | ❌ No | No data-tier assessment applicable |
| Web application / portal | ❌ No | — |
| User accounts / authentication | ❌ No | No authn/authz attack surface |

---

## 2. Items 3 & 4 — Mobile app VAPT and mobile source code review

### ❌ Not applicable — no mobile application exists.

KRC Pune is delivered **exclusively** as a Microsoft Windows desktop application
(NSIS installer, `.exe`). There is no Android application, no iOS application,
and no mobile build target.

**Evidence:**

- `code/package.json` declares a single build target: `"win": { "target": "nsis" }`.
  There is no Android/iOS/Capacitor/Cordova/React Native configuration.
- No mobile framework appears in the dependency tree.
- The CI pipeline (`.github/workflows/build-windows.yml`) produces one artifact:
  a Windows installer.

Some UI code contains responsive breakpoints (`base` / `md` / `lg`). This is
**layout code for varying desktop window sizes only** and does not indicate a
mobile distribution.

> **If KRC's requirement is a security assessment of the delivered artefact**, the
> equivalent in-scope asset is the **Windows desktop application**. Fute Services
> can commission a desktop-application VAPT if KRC requires one — see §5.

---

## 3. Item 5 — API VAPT report

### ❌ Not applicable — the product ships no API and makes no API calls at runtime.

Every data-consuming screen in the shipped application reads from
`src/data/offlineApi.ts`, which returns **statically imported local JSON**. The
former backend was removed during the migration to an offline build.

**Evidence — verified against the compiled production bundle, not just source:**

Scanning `code/dist/assets/` (the actual code that ships inside the installer)
for outbound hosts returns **no external service endpoints**. The only `http(s)://`
strings present are documentation URLs inside third-party library comments and
error messages (`react.dev`, `reactrouter.com`, `mui.com`, `w3.org`).

| Screen | Data source in shipped build |
|---|---|
| VR Tour (`pages/VR/VRPage.tsx`) | `getVrTour()` → local `vrTour.json` |
| Gallery (`pages/Overview/GalleryPage.tsx`) | `getGallery()` → local `gallery.json` |
| Vertical Transport | `getTransport()` → local `transport.json` |
| Mobility | local JSON (no network import present) |
| Floor Plans / Units | `getFloors()` → local `floors.json` |
| Location | bundled local `.mp4` + static image markers |

---

### 🔴 3.1 Important disclosure — dormant backend code is still in the repository

Fute Services should disclose this to KRC rather than let KRC's reviewers find it
and question the "no API" claim.

The repository still contains **unused code that references a live backend**:

| File | Contains | Shipped? |
|---|---|---|
| `src/api/axiosInstance.ts` | `baseURL: " https://api.krpune1.futeservices.in/api"` (note leading space) | ❌ No — not imported by any routed page |
| `src/reusableCustome/api.ts` | `BASE_URL = "https://api.krpune1.futeservices.in/api"` | ❌ No — imported nowhere |
| `src/services/floorServices.ts` | `axiosInstance.get("/floors")` | ❌ No |
| `src/components/Overview/GalleryPage.tsx`, `src/components/ProjectDetails/{MobilityPage,VerticalTransportPage}.tsx` and other **orphaned duplicate pages** | `axios.get(...)` to `krahejabackend.onrender.com` and `http://103.133.214.185:5001` | ❌ No — `src/app/router.tsx` routes **only** `src/pages/**` |

**Why these are genuinely inert in the shipped build:**

- **Verified by static import-reachability analysis** from the entry point
  (`src/main.tsx`): only **46 of 96** code files under `src/` are reachable. Every
  module listed above is unreachable, so Vite never bundles it.
- `axios` **is not even declared as a dependency** in `code/package.json`. Any
  attempt to actually use this code would fail the build.
- Confirmed empirically: none of these hosts appears in the compiled bundle.

**Risk:** low at runtime (dead code cannot execute), but it is a **correctness and
audit-trail risk**. A future developer could import one of these modules and
silently reintroduce a live network dependency — invalidating every claim in this
pack. It also creates the appearance of an undisclosed backend.

**Recommended action — remove the network-referencing dead modules:**

```
code/src/api/axiosInstance.ts
code/src/reusableCustome/api.ts
code/src/reusableCustome/useFetch.tsx
code/src/services/floorServices.ts
code/src/Route/route.tsx      (superseded by src/app/router.tsx)
```

> ⚠️ **Do NOT delete `src/components/` wholesale.** The directory is a mix of live
> and dead code. These three files are **reachable and required** — deleting them
> breaks the build:
>
> - `src/components/Sidebar/Sidebar.tsx` (used by `src/app/RootLayout.tsx`)
> - `src/components/DayNightToggle/DayNightToggle.tsx` (used by `pages/Home/index.tsx`)
> - `src/components/ButtonDiv.tsx` (used by `pages/ProjectDetails/AboutUs.tsx`)
>
> Note the near-identical dead file `src/components/ButtenDiv.tsx` (misspelt) —
> the correctly-spelt `ButtonDiv.tsx` is the live one. Remove the duplicate page
> components under `src/components/{Overview,ProjectDetails,Amenities}/` only
> after confirming each against the reachability list, and **re-run
> `npm run build` to verify** before shipping.

> **Cleanup is optional for KRC's request** — it does not change the security
> posture of the delivered `.exe`, since none of this code ships. It is
> recommended so the repository matches the claims made in this pack.

> **Note on `api.krpune1.futeservices.in`:** if this host is **live**, it is Fute
> Services infrastructure that is *out of scope for this product* but may still
> be internet-exposed. Confirm whether it is decommissioned. If it is still
> serving, either take it down or disclose it to KRC separately — do not leave it
> undeclared while claiming the product has no API.

---

## 4. Internal secure-code review — Windows desktop application

Findings from source inspection. **This is a self-review, not a VAPT.**

### 4.1 Positive findings — hardening already in place

| Control | Status | Location |
|---|---|---|
| `contextIsolation` | ✅ Enabled | `electron/main.cjs` |
| `nodeIntegration` | ✅ Disabled | `electron/main.cjs` |
| Preload IPC bridge | ✅ Deliberate no-op — no privileged surface exposed | `electron/preload.cjs` |
| External-URL containment | ✅ `setWindowOpenHandler` denies in-app loads; `will-navigate` blocks non-`file://` | `electron/main.cjs` |
| Remote content loading | ✅ None — `loadFile()` over `file://` only | `electron/main.cjs` |
| Secrets in version control | ⚠️ Partial — `.env` is **not tracked**, but see finding 7 | `code/.gitignore` |
| Attack surface | ✅ No auth, no PII, no storage, no forms, no telemetry, no listening port | verified by grep |

### 4.2 Findings requiring action

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| 1 | **Medium** | **Installer is not code-signed.** Users are instructed to bypass the SmartScreen warning (*More info → Run anyway*). Integrity/authenticity of a ~1 GB `.exe` cannot be verified | Obtain an OV/EV code-signing certificate. **CI already supports it** — set the `WINDOWS_CERT_BASE64` / `WINDOWS_CERT_PASSWORD` repo secrets and builds sign automatically; no code change needed |
| 2 | **Medium** | **Public distribution.** Installer is served from a public GitHub Release with a stable `latest` URL; bundled marketing media and floor plans are downloadable by anyone with the link | Move to an authenticated/private channel or hand-deliver, if KRC considers the content sensitive |
| 3 | **Low** | **Dormant backend code** referencing three different API hosts (§3.1) | Delete the dead modules listed in §3.1 |
| 4 | **Low** | **Unused secret in local `.env`:** `VITE_MAPBOX_TOKEN`. Nothing in the codebase reads it — `MapboxMap.tsx` uses a bundled `.mp4`, not the Mapbox SDK. Note: any `VITE_`-prefixed variable is **inlined into the client bundle** at build time and is therefore public by design | Delete the variable and **revoke/rotate the token** at Mapbox, since it has been distributed in developer environments and serves no purpose |
| 5 | **Low** | **No update/patch channel.** A vulnerability in a bundled dependency (e.g. Electron 33, Three.js) requires manual redistribution | Agree a patch-notification and redistribution process with KRC. Track Electron security releases |
| 6 | **Informational** | Electron 33 is not the latest major release. No known exploit path exists here given no remote content is loaded, but the bundled Chromium ages | Plan a periodic Electron upgrade cadence |
| 7 | **Medium** | **Repository root has no `.gitignore`.** `code/.gitignore` only governs `code/`. The root `.env` (containing `VITE_MAPBOX_TOKEN`) is untracked but **not ignored**, so a single `git add -A` would commit it to a repository with public releases. `node_modules/`, `dist/` (~644 MB) and `release/` (`.exe`) are likewise unignored at root | Add a root `.gitignore` covering `.env*`, `node_modules/`, `dist/`, `release/`. **Fixed in this commit** — see repository root. Rotate the Mapbox token regardless (finding 4) |

> **Fix status:** all findings above are **open** as of commit `5876920`. Findings
> 3 and 4 should be closed before this pack is sent to KRC, as both directly
> undercut the "offline, no API" statement.

---

## 5. If KRC still requires a formal VAPT

Should KRC's policy mandate a VAPT regardless of the N/A determinations, the
**only** in-scope asset is the **Windows desktop application**. A meaningful
scope would be:

- Electron application security review (against the OWASP/Electron hardening checklist)
- Installer and binary integrity analysis; code-signing verification
- Local privilege and file-permission analysis on the installed footprint
- Bundled third-party dependency (SCA) vulnerability scan
- Verification of the "no outbound traffic" claim by **independent runtime
  network monitoring** on a live install

This must be commissioned from a qualified third-party assessor. Fute Services
cannot self-issue a VAPT report.

**Recommended reply to KRC IT:**

> "Items 3–5 relate to mobile and API assets which this product does not contain
> — it is a fully offline Windows desktop application with no backend. We have
> supplied the network and data-flow diagrams evidencing this, together with an
> internal secure-code review. If your policy requires independent testing of the
> delivered artefact, we propose a desktop-application VAPT with the scope above
> and request your confirmation."

---

## 6. Attestation

> Fute Services declares that, at commit `5876920`, KRC Pune contains no mobile
> application and no API, and performs no network communication at runtime. This
> declaration is based on source-code and compiled-bundle inspection and is
> **not** the result of independent penetration testing.

_Prepared by:_ _[Name, Title]_ · Fute Services · 16 July 2026
_Reviewed / approved by:_ _[Name, Title]_ · _[Date]_
