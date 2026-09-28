# Chrome Audio Sniffer

A Chrome extension that finds audio requests on the current tab and saves audio you are allowed to keep. It offers direct download for recognizable audio files and tab capture for streams or links that do not produce a playable file.

## Install

1. Use Chrome 116 or newer.
2. Download or clone this repository.
3. Open `chrome://extensions` and turn on **Developer mode**.
4. Click **Load unpacked** and select this repository's folder.
5. After pulling changes, click **Reload** on the extension's card.

## Use

1. Open the page containing the audio and start playback.
2. Open **Audio Finder & Recorder** from Chrome's toolbar.
3. Click **Download** beside a detected audio file to save its original format. The extension checks its first bytes before downloading.
4. If the link cannot be downloaded as a playable file, choose **MP3**, **M4A**, or **WebM** under **Save as**, then click **Capture** or **Start capture**.
5. Replay the song from its beginning. Return to the popup and click **Stop & save**.

The format selector applies to tab captures. Direct downloads retain the format served by the website. MP3 capture is the default and uses the bundled LAME encoder at 192 kbps. M4A requires a Chrome version that supports audio MP4 recording; select MP3 or WebM if Chrome reports that M4A is unavailable.

## What to expect

- Captures include **everything audible in that tab** while recording. Start capture before replaying the song.
- The extension cannot turn arbitrary encrypted, expired, or nonstandard network bytes into a standalone audio file. Capture records the audio that Chrome plays instead.
- It does not reconstruct HLS/DASH segments or bypass protected media systems. Some protected audio may not be capturable.
- Direct download may still fail if a URL expires, requires special request headers, or serves different content when fetched again.
- Use the extension only for audio you have permission to save.

## For developers

See [documentation.md](documentation.md) for architecture, permissions, formats, testing, and troubleshooting. See [changelog.md](changelog.md) for version history.

The project has no build step. `manifest.json` is the extension entry point. The MP3 encoder is vendored in `vendor/`; see its license notice and source there. The rest of this repository does not yet declare a project license.
