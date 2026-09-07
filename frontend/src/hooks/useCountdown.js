// useCountdown - counts a number of seconds down to zero, once per second.
//
// Used for the "resend in 47s" cooldown. Call start() to (re)begin; the
// interval clears itself at zero and on unmount, so nothing keeps ticking
// after the component has gone.
import { useEffect, useRef, useState } from 'react';

export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef(null);

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function start(seconds) {
    stop();
    setSecondsLeft(seconds);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          stop();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  // Clear the interval if the component unmounts mid-countdown.
  useEffect(() => stop, []);

  return { secondsLeft, start };
}
