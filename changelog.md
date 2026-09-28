# Changelog

Changes to Chrome Audio Sniffer are listed here. Dates use the local development date.

## 1.1.0 — 2026-09-29

- Added a capture format selector with MP3, M4A, and WebM output. MP3 is the default.
- Bundled lamejs for real 192 kbps MP3 encoding instead of renaming a WebM file.
- Added **Capture** beside detected requests, so a non-downloadable response has an immediate recording path.
- Improved capture completion and saved-file naming.
- Added response-signature validation before direct downloads to reject obvious non-audio data.
- Added developer documentation and clarified installation, privacy, and format limitations.

## 1.0.0 — 2026-09-29

- Initial Manifest V3 extension with per-tab audio request detection and direct downloads.
- Added tab audio capture through an offscreen document.
- Added popup controls, temporary per-tab URL history, and basic installation instructions.
