import { useEffect, useState } from 'react';

/** Reads duration and a thumbnail from a local File in the browser (not all formats are decodable). */
export function useVideoMeta(file) {
  const [meta, setMeta] = useState({ duration: 0, thumb: null });
  useEffect(() => {
    setMeta({ duration: 0, thumb: null });
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url;
    v.onloadedmetadata = () => {
      setMeta((m) => ({ ...m, duration: Number.isFinite(v.duration) ? v.duration : 0 }));
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 480; c.height = Math.round((480 * v.videoHeight) / v.videoWidth) || 270;
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        setMeta((m) => ({ ...m, thumb: c.toDataURL('image/jpeg', 0.7) }));
      } catch { /* thumbnail is optional */ }
    };
    v.onerror = () => {};
    return () => { URL.revokeObjectURL(url); v.removeAttribute('src'); };
  }, [file]);
  return meta;
}
