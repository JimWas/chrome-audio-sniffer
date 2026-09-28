const sessions = new Map();

function isAudioFile(bytes) {
  const ascii = (start, length) => String.fromCharCode(...bytes.slice(start, start + length));
  if (ascii(0, 3) === "ID3" || ascii(0, 4) === "OggS" || ascii(0, 4) === "fLaC") return true;
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return true;
  if (ascii(4, 4) === "ftyp" || (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)) return true;
  return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

function safeTitle(value) {
  return String(value || "tab-audio").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").slice(0, 100) || "tab-audio";
}

function saveAudio(chunks, type, extension, title) {
  if (!chunks.length) throw new Error("No audio was captured. Play the song while recording, then try again.");
  const url = URL.createObjectURL(new Blob(chunks, { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function pcm16(samples) {
  const result = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    result[i] = sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
  }
  return result;
}

async function finishSession(session) {
  if (session.finishing) return session.finished;
  session.finishing = true;
  let result;
  try {
    if (session.format === "mp3") {
      session.processor.disconnect();
      session.processor.onaudioprocess = null;
      if (session.frames === 0) throw new Error("No audio was captured. Replay the song after starting the recording.");
      const last = session.encoder.flush();
      if (last.length) session.chunks.push(new Uint8Array(last));
      saveAudio(session.chunks, "audio/mpeg", "mp3", session.title);
    } else {
      if (session.recorder.state !== "inactive") session.recorder.stop();
      await session.recorderStopped;
      saveAudio(session.chunks, session.mimeType, session.format, session.title);
    }
    result = { ok: true };
  } catch (error) {
    result = { ok: false, error: error.message };
  } finally {
    session.stream.getTracks().forEach(track => track.stop());
    session.source.disconnect();
    await session.context.close().catch(() => {});
    sessions.delete(session.tabId);
    session.resolveFinished(result);
  }
  return session.finished;
}

async function startSession(message) {
  if (sessions.has(message.tabId)) throw new Error("Already recording this tab.");
  const format = message.format || "mp3";
  if (!["mp3", "m4a", "webm"].includes(format)) throw new Error("Unsupported output format.");
  const mimeTypes = format === "m4a" ? ["audio/mp4;codecs=mp4a.40.2", "audio/mp4"] : ["audio/webm;codecs=opus", "audio/webm"];
  const mimeType = format === "mp3" ? "audio/mpeg" : mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error(`${format.toUpperCase()} recording is unavailable in this Chrome version. Choose MP3 or WebM.`);
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: message.streamId } },
    video: false
  });
  let context;
  try {
    context = new AudioContext(format === "mp3" ? { sampleRate: 44100 } : undefined);
    const source = context.createMediaStreamSource(stream);
    source.connect(context.destination);
    let resolveFinished;
    const finished = new Promise(resolve => { resolveFinished = resolve; });
    const session = { tabId: message.tabId, format, mimeType, title: safeTitle(message.title), stream, context, source, chunks: [], finished, resolveFinished, finishing: false };
    if (format === "mp3") {
      const encoder = new lamejs.Mp3Encoder(2, context.sampleRate, 192);
      const processor = context.createScriptProcessor(4096, 2, 2);
      session.encoder = encoder;
      session.processor = processor;
      session.frames = 0;
      processor.onaudioprocess = event => {
        if (session.finishing) return;
        const input = event.inputBuffer;
        const left = pcm16(input.getChannelData(0));
        const right = pcm16(input.getChannelData(input.numberOfChannels > 1 ? 1 : 0));
        const encoded = encoder.encodeBuffer(left, right);
        if (encoded.length) session.chunks.push(new Uint8Array(encoded));
        session.frames += input.length;
      };
      source.connect(processor);
      processor.connect(context.destination);
    } else {
      const recorder = new MediaRecorder(stream, { mimeType });
      session.recorder = recorder;
      session.recorderStopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.ondataavailable = event => { if (event.data.size) session.chunks.push(event.data); };
      recorder.start(1000);
    }
    sessions.set(message.tabId, session);
    stream.getAudioTracks()[0].onended = () => { finishSession(session).catch(() => {}); };
  } catch (error) {
    stream.getTracks().forEach(track => track.stop());
    if (context) await context.close().catch(() => {});
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target !== "offscreen") return;
  (async () => {
    if (message.type === "status") {
      const session = sessions.get(message.tabId);
      reply({ ok: true, recording: Boolean(session), format: session?.format });
    } else if (message.type === "validate") {
      const response = await fetch(message.url, { credentials: "include", headers: { Range: "bytes=0-4095" }, cache: "no-store" });
      if (!response.ok) throw new Error("Could not check this audio link. Try Capture instead.");
      const reader = response.body.getReader();
      const first = await reader.read();
      await reader.cancel();
      if (!isAudioFile(first.value || new Uint8Array())) throw new Error("This link did not return a recognizable audio file. Choose Capture, replay the song, then save.");
      reply({ ok: true });
    } else if (message.type === "start") {
      await startSession(message);
      reply({ ok: true });
    } else if (message.type === "stop") {
      const session = sessions.get(message.tabId);
      if (!session) throw new Error("No recording is running for this tab.");
      reply(await finishSession(session));
    }
  })().catch(error => reply({ ok: false, error: error.message }));
  return true;
});
