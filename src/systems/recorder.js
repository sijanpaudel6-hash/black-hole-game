// Clip recorder: keeps roughly the last 20 seconds of the game canvas (plus sound) as a
// vertical 9:16 video, using canvas.captureStream + MediaRecorder.
//
// WebM can't be trimmed without re-encoding, so instead a fresh recorder starts every
// RECORDING.restartEvery seconds and up to RECORDING.recorders overlap. When you save,
// the newest recorder that has run for at least clipSeconds is used, so a clip is
// 20–30 s long and ends at the moment you stopped.

import { RECORDING } from '../config.js';

const TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

export function recordingSupported() {
  return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
}

function pickType() {
  for (const t of TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // ignore
    }
  }
  return '';
}

export class ClipRecorder {
  constructor(canvas, audioStream) {
    this.canvas = canvas;
    this.audioStream = audioStream;
    this.slots = [];
    this.recording = false;
  }

  start() {
    if (this.recording || !recordingSupported()) return false;
    try {
      this.stream = this.canvas.captureStream(RECORDING.fps);
      const audioTrack = this.audioStream?.getAudioTracks()[0];
      if (audioTrack) this.stream.addTrack(audioTrack);
      this.mimeType = pickType();
      this.startedAt = performance.now();
      this.recording = true;
      this.spawn();
      this.timer = setInterval(() => this.spawn(), RECORDING.restartEvery * 1000);
      return true;
    } catch (e) {
      console.warn('Recording failed to start', e);
      this.recording = false;
      return false;
    }
  }

  get elapsed() {
    return this.recording ? (performance.now() - this.startedAt) / 1000 : 0;
  }

  spawn() {
    const options = { videoBitsPerSecond: RECORDING.videoBitsPerSecond };
    if (this.mimeType) options.mimeType = this.mimeType;
    const rec = new MediaRecorder(this.stream, options);
    const slot = { rec, chunks: [], start: performance.now() };
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) slot.chunks.push(e.data);
    };
    rec.start(1000);
    this.slots.push(slot);
    while (this.slots.length > RECORDING.recorders) {
      const old = this.slots.shift();
      try {
        old.rec.stop();
      } catch {
        // ignore
      }
    }
  }

  /** Stop recording. @returns {Promise<{blob: Blob, seconds: number}|null>} */
  stop() {
    if (!this.recording) return Promise.resolve(null);
    this.recording = false;
    clearInterval(this.timer);
    const now = performance.now();
    const old = this.slots.filter((s) => (now - s.start) / 1000 >= RECORDING.clipSeconds);
    const chosen = old.length ? old[old.length - 1] : this.slots[0];
    const others = this.slots.filter((s) => s !== chosen);
    this.slots = [];
    others.forEach((s) => {
      try {
        s.rec.stop();
      } catch {
        // ignore
      }
    });
    const stopTracks = () => this.stream?.getVideoTracks().forEach((t) => t.stop());
    if (!chosen) {
      stopTracks();
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      chosen.rec.onstop = () => {
        stopTracks();
        const blob = new Blob(chosen.chunks, { type: this.mimeType || 'video/webm' });
        resolve({ blob, seconds: (now - chosen.start) / 1000 });
      };
      try {
        chosen.rec.stop();
      } catch {
        stopTracks();
        resolve(null);
      }
    });
  }
}

/** Offer the clip as a download (Android Chrome saves it to Downloads). */
export function downloadClip(blob) {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `black-hole-clip-${stamp}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
