# 2. Data / Information Flow Diagram — KRC Pune

**Product:** KRC Pune — VR / Amenities Sales Experience Application
**Vendor:** Fute Services
**Document date:** 16 July 2026
**Assessed at commit:** `5876920` (`main`)

---

## 1. Summary

KRC Pune is a **read-only content presentation application**. Data flows in
exactly one direction:

> **bundled static asset on local disk → screen**

The application:

- **collects no data** — it has no forms, no text inputs, no submit handlers
- **stores no data** — no `localStorage`, `sessionStorage`, `indexedDB`, or cookies
- **transmits no data** — no API calls, no telemetry, no analytics, no crash reporting
- **processes no personal data** — no PII, no user accounts, no authentication

**There is no personal data in this system.** Consequently there is no data
classification, retention schedule, cross-border transfer, encryption-in-transit
requirement, or data-subject-rights exposure to assess.

---

## 2. Data flow diagram

```mermaid
flowchart TB
    subgraph BUILD["🏗️ BUILD TIME — Fute Services (before delivery)"]
        direction LR
        SRC["Product content<br/>360° renders · videos<br/>floor plans · brochure"]
        JSON["Static JSON<br/>src/data/offline/<br/>floors · amenities · gallery<br/>mobility · transport · vrTour"]
        BUNDLE["vite build +<br/>electron-builder<br/>→ KRC.Pune.Setup.exe"]
        SRC --> BUNDLE
        JSON --> BUNDLE
    end

    BUNDLE ==>|"one-time installer<br/>handover"| INSTALL

    subgraph RUNTIME["🖥️ RUN TIME — KRC Windows machine (offline)"]
        direction TB
        INSTALL["Installed app<br/>app.asar + unpacked media"]

        subgraph DATA["Local read-only data"]
            D1["offlineApi.ts<br/><i>static JSON imports</i>"]
            D2["media/<br/><i>.jpg .mp4 .pdf</i>"]
        end

        subgraph UI["React 19 renderer"]
            P1["Home / Overview"]
            P2["VR Tour<br/>(Pannellum, local)"]
            P3["Amenities"]
            P4["Floor Plans /<br/>Unit Inventory"]
            P5["Location<br/>(local .mp4 + markers)"]
            P6["Gallery"]
        end

        SCREEN["🖵 Display<br/><i>Sales executive + prospect</i>"]

        INSTALL --> D1
        INSTALL --> D2
        D1 -->|"read"| UI
        D2 -->|"read"| UI
        UI -->|"render"| SCREEN
    end

    VOID("<b>No outbound data flow</b><br/>❌ nothing captured<br/>❌ nothing stored<br/>❌ nothing sent")
    SCREEN x-.-x VOID

    style BUILD fill:#fff8e6,stroke:#d68910,stroke-width:2px
    style RUNTIME fill:#eef5ff,stroke:#2c5aa0,stroke-width:2px
    style DATA fill:#f4f4f4,stroke:#777
    style UI fill:#ffffff,stroke:#2c5aa0
    style SCREEN fill:#e8f6e9,stroke:#27ae60,stroke-width:2px
    style VOID fill:#ffe6e6,stroke:#c0392b,stroke-width:2px,stroke-dasharray: 5 5
```

---

## 3. Data inventory

| Data set | Classification | Contains PII? | At rest | In transit | Retention |
|---|---|---|---|---|---|
| Floor / unit inventory (`floors.json`) | Business — Internal | ❌ No | Local disk, inside `app.asar` | ❌ Never transmitted | Life of installation |
| Amenities, gallery, mobility, transport (JSON) | Business — Public marketing | ❌ No | Local disk, inside `app.asar` | ❌ Never transmitted | Life of installation |
| 360° panoramas, videos, brochure PDF | Business — Public marketing | ❌ No | Local disk, `app.asar.unpacked/dist/media/` | ❌ Never transmitted | Life of installation |
| User / prospect data | — | **N/A — none captured** | — | — | — |
| Credentials / tokens | — | **N/A — none at runtime** | — | — | — |
| Logs / telemetry | — | **N/A — none generated** | — | — | — |

### 3.1 Trust boundaries

There is **one** trust boundary — the installer handover. After it is crossed,
the application is self-contained and inert with respect to data movement.

| Boundary | Crossed by | Direction | Control |
|---|---|---|---|
| Fute Services build → KRC machine | `KRC.Pune.Setup.exe` | Vendor → KRC, **one-time** | Manual/HTTPS download. **Currently unsigned** — see `01-network-architecture.md` §4 |
| KRC machine → Internet | *nothing* | — | No outbound path exists |

---

## 4. Data-at-rest note for KRC IT

Because the app is offline and read-only, the realistic data concern is **not
leakage in transit — it is physical/local access to the installed content**:

- The bundled content (floor plans, unit inventory, unreleased renders) sits
  unencrypted on the local disk inside `app.asar`. **`.asar` is an archive
  format, not encryption** — its contents can be extracted by anyone with file
  access to the machine.
- The same content is downloadable by anyone holding the public GitHub Release
  link.

**Recommendation:** if any bundled content is commercially sensitive
(e.g. unreleased inventory or pricing), protect it with **machine-level
controls** — disk encryption (BitLocker), restricted local accounts, and kiosk
lockdown on the sales-lounge PC — plus a private distribution channel. Attempting
to protect it inside the application itself would provide no real assurance.

---

## 5. Attestation

> Verified by direct code inspection at commit `5876920`: no storage APIs, no
> input/form elements, no analytics or telemetry SDKs, and no outbound hosts in
> the compiled bundle. This is a **Fute Services self-declaration**, not an
> independent third-party audit.

_Prepared by:_ _[Name, Title]_ · Fute Services · 16 July 2026
