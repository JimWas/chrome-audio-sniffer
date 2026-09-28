const MAX_ITEMS = 40;
const audioExtensions = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|weba|webm)(?:$|[?#])/i;
const playlistExtensions = /\.(m3u8|mpd)(?:$|[?#])/i;
const audioMime = /^(audio\/|application\/(ogg|x-ogg|vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))/i;

function header(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name)?.value || "";
}

function classify(url, mime) {
  const cleanMime = mime.split(";")[0].trim().toLowerCase();
  if (playlistExtensions.test(url) || /mpegurl|dash\+xml/.test(cleanMime)) return "stream";
  if (audioExtensions.test(url) || audioMime.test(cleanMime)) return "audio";
  return null;
}

function safeName(url, mime) {
  let name;
  try { name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "audio"); }
  catch { name = "audio"; }
  name = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 120) || "audio";
  if (!/\.[a-z0-9]{2,5}$/i.test(name)) {
    const ext = mime.includes("mpeg") ? "mp3" : mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : mime.includes("flac") ? "flac" : mime.includes("webm") ? "webm" : "audio";
    name += "." + ext;
  }
  return name;
}

chrome.webRequest.onHeadersReceived.addListener(async details => {
  if (details.tabId < 0 || details.statusCode < 200 || details.statusCode >= 400) return;
  const mime = header(details.responseHeaders, "content-type");
  const kind = classify(details.url, mime);
  if (!kind) return;
  const key = `tab:${details.tabId}`;
  const current = (await chrome.storage.session.get(key))[key] || [];
  const url = details.url;
  const existing = current.findIndex(item => item.url === url);
  if (existing >= 0) current.splice(existing, 1);
  current.unshift({ url, kind, mime, name: safeName(url, mime), seen: Date.now() });
  await chrome.storage.session.set({ [key]: current.slice(0, MAX_ITEMS) });
  chrome.action.setBadgeText({ tabId: details.tabId, text: String(Math.min(current.length, 99)) }).catch(() => {});
}, { urls: ["<all_urls>"], types: ["media", "xmlhttprequest", "other"] }, ["responseHeaders"]);

chrome.tabs.onRemoved.addListener(tabId => {
  chrome.storage.session.remove(`tab:${tabId}`);
});

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA", "BLOBS"],
    justification: "Record audio from the user-selected tab and save it locally."
  });
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  (async () => {
    if (message.type === "list") {
      const key = `tab:${message.tabId}`;
      const state = await chrome.offscreen.hasDocument()
        ? await chrome.runtime.sendMessage({ target: "offscreen", type: "status", tabId: message.tabId })
        : { recording: false };
      reply({ items: (await chrome.storage.session.get(key))[key] || [], recording: state.recording, format: state.format });
    } else if (message.type === "clear") {
      await chrome.storage.session.remove(`tab:${message.tabId}`);
      await chrome.action.setBadgeText({ tabId: message.tabId, text: "" });
      reply({ ok: true });
    } else if (message.type === "download") {
      const key = `tab:${message.tabId}`;
      const items = (await chrome.storage.session.get(key))[key] || [];
      const item = items.find(value => value.url === message.url && value.kind === "audio");
      if (!item) throw new Error("Audio URL is no longer in this tab’s list.");
      await ensureOffscreen();
      const check = await chrome.runtime.sendMessage({ target: "offscreen", type: "validate", url: item.url });
      if (!check?.ok) throw new Error(check?.error || "This response is not a playable audio file. Try Record tab audio instead.");
      const id = await chrome.downloads.download({ url: item.url, filename: `Audio Finder/${item.name}`, conflictAction: "uniquify", saveAs: true });
      reply({ ok: true, id });
    } else if (message.type === "start") {
      await ensureOffscreen();
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: message.tabId });
      const result = await chrome.runtime.sendMessage({ target: "offscreen", type: "start", tabId: message.tabId, streamId, title: message.title, format: message.format });
      if (!result?.ok) throw new Error(result?.error || "Could not start recording.");
      reply({ ok: true });
    } else if (message.type === "stop") {
      const result = await chrome.runtime.sendMessage({ target: "offscreen", type: "stop", tabId: message.tabId });
      if (!result?.ok) throw new Error(result?.error || "Could not stop recording.");
      reply({ ok: true });
    }
  })().catch(error => reply({ ok: false, error: error.message }));
  return true;
});
