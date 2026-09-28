const itemsNode = document.querySelector("#items");
const statusNode = document.querySelector("#status");
const recordButton = document.querySelector("#record");
const formatSelect = document.querySelector("#format");
let tabId;
let isRecording = false;
let tabTitle = "tab-audio";

function status(message) { statusNode.textContent = message || ""; }
async function send(message) {
  const response = await chrome.runtime.sendMessage({ ...message, tabId });
  if (!response?.ok && response?.error) throw new Error(response.error);
  return response;
}
function render(items) {
  itemsNode.replaceChildren();
  document.querySelector("#count").textContent = items.length;
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No audio found yet. Start playback on this page, then refresh.";
    itemsNode.append(empty);
    return;
  }
  for (const item of items) {
    const row = document.createElement("div"); row.className = "item";
    const info = document.createElement("div"); info.className = "item-main";
    const name = document.createElement("strong"); name.textContent = item.name;
    const url = document.createElement("small"); url.textContent = item.url; url.title = item.url;
    const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = item.kind === "stream" ? "Stream playlist" : "Audio file";
    info.append(name, url, tag);
    const actions = document.createElement("div"); actions.className = "actions";
    if (item.kind === "audio") {
      const download = document.createElement("button"); download.textContent = "Download";
      download.addEventListener("click", async () => {
        try { await send({ type: "download", url: item.url }); status("Download started. Check Chrome Downloads."); }
        catch (error) { status(error.message); }
      });
      actions.append(download);
    }
    const capture = document.createElement("button"); capture.textContent = "Capture";
    capture.addEventListener("click", async () => { try { await startCapture(item.name); } catch (error) { status(error.message); } });
    actions.append(capture);
    row.append(info, actions); itemsNode.append(row);
  }
}
async function refresh() {
  if (!tabId) return;
  try {
    const result = await send({ type: "list" });
    render(result.items);
    isRecording = result.recording;
    if (isRecording && result.format) formatSelect.value = result.format;
    recordButton.textContent = isRecording ? "Stop & save" : "Start capture";
    recordButton.classList.toggle("active", isRecording);
    formatSelect.disabled = isRecording;
  } catch (error) { status(error.message); }
}
document.querySelector("#refresh").addEventListener("click", refresh);
formatSelect.addEventListener("change", () => chrome.storage.local.set({ outputFormat: formatSelect.value }));
document.querySelector("#clear").addEventListener("click", async () => { try { await send({ type: "clear" }); await refresh(); status("List cleared."); } catch(error) { status(error.message); } });
async function startCapture(title) {
  if (isRecording) throw new Error("A capture is already running. Stop and save it first.");
  await send({ type: "start", title: title || tabTitle, format: formatSelect.value });
  await refresh();
  status("Capturing tab audio. Replay the song from the start, then choose Stop & save.");
}
recordButton.addEventListener("click", async () => {
  recordButton.disabled = true;
  try {
    if (isRecording) { await send({ type: "stop" }); status("Recording saved to Downloads."); }
    else { await startCapture(tabTitle); }
    await refresh();
  } catch (error) { status(error.message); }
  finally { recordButton.disabled = false; }
});
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || "")) { status("Open a website tab to find audio."); recordButton.disabled = true; return; }
  tabId = tab.id;
  tabTitle = tab.title || "tab-audio";
  const saved = (await chrome.storage.local.get("outputFormat")).outputFormat;
  if (["mp3", "m4a", "webm"].includes(saved)) formatSelect.value = saved;
  await refresh();
})();
