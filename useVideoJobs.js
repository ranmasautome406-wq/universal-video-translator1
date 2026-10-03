import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

/** Loads a video and its translation jobs, polling while any job is still running. */
export function useVideoJobs(videoId) {
  const [state, setState] = useState({ video: null, jobs: [], loading: true, error: '' });

  const load = useCallback(async () => {
    try {
      const [v, j] = await Promise.all([api(`/api/videos/${videoId}`), api(`/api/translate/video/${videoId}`)]);
      setState({ video: v.video, jobs: j.jobs, loading: false, error: '' });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [videoId]);

  useEffect(() => { load(); }, [load]);

  const active = state.jobs.some((j) => j.status === 'queued' || j.status === 'processing');
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(load, 1200);
    return () => clearInterval(t);
  }, [active, load]);

  return { ...state, reload: load };
}
