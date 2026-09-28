# Developer documentation

## Project layout

| Path | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 entry point, permissions, popup, and service worker. |
| `background.js` | Detects response URLs, stores per-tab results, starts captures, and initiates direct downloads. |
| `popup.html`, `popup.css`, `popup.js` | User interface for detected URLs, format selection, and capture controls. |
| `offscreen.html`, `offscreen.js` | Long-lived capture document, audio encoding, file checks, and local save. |
| `icons/` | Master artwork and PNG sizes used by the Chrome toolbar and extension listing. |
| `vendor/lame.min.js` | Browser-ready lamejs MP3 encoder. |
| `vendor/lamejs-source/`, `vendor/LAMEJS-LICENSE` | Bundled encoder source and license notice. |

No bundler, server, account, or runtime dependency is required. Load this folder as an unpacked Chrome extension.

The icon master is `icons/icon-master.png`. When changing it, regenerate the 16, 32, 48, and 128 pixel PNGs and update `manifest.json` if filenames change. Check the 16-pixel version visually; details that look good at full size can disappear in Chrome's toolbar.

## Request detection and direct download

`chrome.webRequest.onHeadersReceived` watches `media`, `xmlhttprequest`, and `other` responses associated with a tab. A URL extension or `Content-Type` classifies a response as an audio file or stream playlist. The newest 40 unique URLs per tab are kept in `chrome.storage.session` under `tab:<tabId>` and shown in the popup. Closing a tab removes its list.

A direct **Download** action first asks the offscreen document to fetch a small initial byte range with cookies and check common audio/container signatures: MP3, MP4/M4A, Ogg, WAV, FLAC, or WebM. If recognized, `chrome.downloads.download` saves the original URL. This is a quick guard against obvious non-audio responses, not full media validation. The validation fetch and Chrome's subsequent download are separate requests, so they can receive different content. An audio extension or MIME type alone is never proof that a response is playable.

Playlist URLs are detected to explain why a stream appears in the list. The extension does not fetch, decrypt, or assemble HLS/DASH segments.

## Tab capture and output formats

Capture begins only after a user clicks the extension. The service worker obtains a tab media stream ID with `chrome.tabCapture.getMediaStreamId` and sends it to an offscreen document. The offscreen document uses `getUserMedia` to receive the stream and routes audio through an `AudioContext` to preserve playback in the tab. A capture continues when the popup closes. The selected format is saved in `chrome.storage.local` for later popups.

| Output | Encoder | Notes |
| --- | --- | --- |
| MP3 | Bundled lamejs, stereo, 44.1 kHz, 192 kbps | Default. PCM is encoded incrementally using `ScriptProcessorNode`. |
| M4A | Chrome `MediaRecorder` with audio MP4/AAC | Available only when `MediaRecorder.isTypeSupported` reports support. |
| WebM | Chrome `MediaRecorder` with Opus | Fallback option for Chrome versions without M4A recording. |

Stopping capture saves a Blob through a download link in the offscreen document. Captures use a sanitized tab or detected-item title plus a timestamp. No recording is sent to a server. The JavaScript MP3 encoder runs in the offscreen document; CPU use may rise during long MP3 captures. `ScriptProcessorNode` is deprecated and should eventually be replaced by an AudioWorklet and a worker-based encoder. Avoid making a file extension selectable unless the encoded bytes actually use that format.

## Permissions and data

| Permission | Why it is needed |
| --- | --- |
| `webRequest` and `<all_urls>` host permissions | Observe audio response URLs across websites and validate selected downloads. |
| `activeTab` and `tabCapture` | Capture sound from the tab after a user action. |
| `offscreen` | Keep recording while the popup is closed. |
| `downloads` | Save detected direct audio URLs. |
| `storage` | Keep recent per-tab URLs and the user's output-format preference. |
| `tabs` | Identify the active tab and clear its list on close. |

The extension does not include analytics or an external service. Detected URLs remain in temporary browser storage until their tab closes or the user clears the list. The chosen output format persists locally. Audio is processed in the browser and saved through Chrome's download flow. URL lists may contain sensitive query parameters, so do not add telemetry or sync storage without a separate privacy review.

## Development and verification

1. Edit the source files directly and reload the unpacked extension at `chrome://extensions`.
2. Check JavaScript syntax with `node --check background.js`, `node --check popup.js`, and `node --check offscreen.js`.
3. Check `manifest.json` with `python3 -m json.tool manifest.json`.
4. Test a known direct MP3, a non-audio URL with an audio-looking name, and tab capture in MP3, M4A, and WebM. Confirm each saved file with a media probe or player. Test stop/save after closing and reopening the popup.
5. For capture problems, inspect the extension service worker and offscreen document from `chrome://extensions`. For download failures, compare the validation response with the final download; the two requests can differ.

A synthetic sine-wave test was encoded with the vendored lamejs bundle and recognized as stereo 44.1 kHz MP3 by `ffprobe`. That test does not replace a live Chrome recording test.

## Third-party code

The bundled lamejs encoder is version 1.2.1 and is licensed under LGPL-3.0. Its browser bundle, source, and notice are in `vendor/`. If replacing or modifying it, preserve the corresponding source and licensing information. Project code outside `vendor/` has no declared license yet.
