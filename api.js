const BASE = import.meta.env.VITE_API_URL || '';
const KEY = 'uvt_token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  set: (t, remember) => { tokenStore.clear(); (remember ? localStorage : sessionStorage).setItem(KEY, t); },
  clear: () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); },
};

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

/** Authenticated URL for <video src>, <a href> downloads (browsers can't send headers there). */
export const authedUrl = (path) => `${BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(tokenStore.get() || '')}`;

export async function api(path, { method = 'GET', body, form, onProgress } = {}) {
  const token = tokenStore.get();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  // XHR for uploads so we can report progress.
  if (form && onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, BASE + path);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onerror = () => reject(new ApiError("Upload failed. Check your connection and try again.", 0));
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(data.error || 'Upload failed. Please try again.', xhr.status));
      };
      xhr.send(form);
    });
  }

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and that the backend is running.", 0);
  }
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('uvt:unauthorized'));
    throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status);
  }
  return data;
}
