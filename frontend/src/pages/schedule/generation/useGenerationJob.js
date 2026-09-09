// useGenerationJob - polls a running generation job, and stops.
//
// A poll loop that never stops is a real bug: it keeps hitting the server
// after the answer is known, and survives the user navigating away. This one
// stops on completed, on failed, and on unmount.
import { useState, useEffect, useRef } from 'react';
import { getJob } from '../../../features/roster/api/jobs.js';
import { useOrg } from '../../../features/organisation/useOrg.js';

const POLL_MS = 1500;

/**
 * A job is finished when it has completed or failed. Pulled out as a plain
 * function so the stop condition is something that can be read and tested,
 * rather than a comparison buried inside an effect.
 */
export function isFinished(status) {
  return status === 'completed' || status === 'failed';
}

export function useGenerationJob(jobId, onFinished) {
  const { orgId } = useOrg();
  const [job, setJob] = useState(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!jobId) return undefined;

    let alive = true;
    finishedRef.current = false;

    async function poll() {
      try {
        const next = await getJob(orgId, jobId);
        if (!alive) return;

        setJob(next);

        if (isFinished(next.status)) {
          finishedRef.current = true;
          clearInterval(timer);
          onFinished?.(next);
        }
      } catch {
        // A failed poll is not fatal; the next tick tries again. A job that
        // truly died is caught by the server marking it failed.
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [orgId, jobId, onFinished]);

  return job;
}
