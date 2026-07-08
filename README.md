# KRC Pune

Offline desktop application (React + Vite + Electron) with a VR tour, amenities,
location, and inventory experience.

## Download (Windows)

**Latest installer:**

👉 **[Download KRC Pune Setup (.exe)](https://github.com/Fute-Services/krpune/releases/download/latest/KRC.Pune.Setup.0.0.0.exe)**

All builds are also listed on the [Releases page](https://github.com/Fute-Services/krpune/releases).

> This link always points to the newest build. Every push to `main` rebuilds the
> installer and updates this same link automatically.
>
> On first run, Windows SmartScreen may show a warning (the app is not
> code-signed). Click **More info → Run anyway**.

## How the build works

A GitHub Actions workflow (`.github/workflows/build-windows.yml`) runs on every
push to `main`:

1. Installs dependencies (`npm ci`).
2. Builds the app and packages the Windows installer (`npm run app:dist`).
3. Uploads the installer as a workflow artifact **and** publishes it to the
   `latest` GitHub Release.
4. Prints a direct download link in the run's **Summary** tab.

To cut a versioned release instead of the rolling `latest`, push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Local development

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server
npm run electron # run the built app in Electron
npm run app:dist # build the Windows installer locally (output in release/)
```
