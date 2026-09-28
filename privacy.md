# Privacy Policy — Audio Finder & Recorder

Effective date: September 29, 2026

Audio Finder & Recorder is a Chrome extension that detects audio requests on web pages, downloads recognizable audio files, and records audio from a tab when the user starts capture. The extension does not have an account system, advertising, analytics, or a developer-operated server.

## Data the extension handles

- **Audio request URLs and response metadata:** The extension observes request URLs and content-type headers so it can show candidate audio links for the current tab. Up to 40 recent URLs per tab are stored in Chrome's temporary extension session storage. Closing a tab or using **Clear** removes its list.
- **Audio from the selected tab:** Audio is accessed only after the user starts a capture. It is processed locally in Chrome and saved as a file chosen by the user. The extension does not transmit recordings to the developer.
- **Output-format preference:** The selected MP3, M4A, or WebM format is stored in Chrome's local extension storage until changed, cleared, or the extension is removed.

When the user requests a direct download, the extension fetches the selected audio URL to check its file header and then asks Chrome to download it. Those requests go to the website that supplied the URL. The extension may include the browser's existing cookies in its validation request to that website; it does not read or store cookie values. Files saved to the user's Downloads folder remain there until the user removes them.

## Sharing and retention

The developer does not receive, sell, or share browsing URLs, audio, recordings, or format preferences. Data is not used for advertising, tracking, credit decisions, or unrelated purposes. Chrome and the visited website process network requests according to their own policies. The extension's temporary URL list is removed when its tab closes or the user clears it. Local preferences remain until cleared or the extension is uninstalled.

## Contact and changes

Questions or privacy requests can be filed at [the project's GitHub issues page](https://github.com/JimWas/chrome-audio-sniffer/issues). Material changes to this policy will be published in this repository before a new extension version is released.
