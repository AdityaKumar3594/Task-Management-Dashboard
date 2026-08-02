import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * FIX #5: Render free tier cold start — shows a banner when the first API
 * call takes more than 2 seconds, so users know the server is waking up.
 */
export default function ApiWarmup() {
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 2000);

    api.get('/health')
      .then(() => { clearTimeout(timer); setSlow(false); setDone(true); })
      .catch(() => { clearTimeout(timer); setDone(true); });

    return () => clearTimeout(timer);
  }, []);

  if (done || !slow) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
        <svg className="h-4 w-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-medium text-amber-800">
          Server is waking up — first load may take ~30 seconds
        </p>
      </div>
    </div>
  );
}
