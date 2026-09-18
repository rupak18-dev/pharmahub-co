import React, { useState, useEffect } from "react";

export function ResendTimer({ initialSeconds = 30 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timerId = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const handleResend = () => {
    // In a real app, trigger resend API here
    setCanResend(false);
    setSeconds(initialSeconds);
  };

  return (
    <div className="mt-6 text-center text-sm">
      <span className="text-muted-foreground mr-1">Didn't receive the code?</span>
      {canResend ? (
        <button
          type="button"
          onClick={handleResend}
          className="font-bold text-primary hover:underline focus:outline-none"
        >
          Resend Code
        </button>
      ) : (
        <span className="font-bold text-foreground">Resend in {seconds}s</span>
      )}
    </div>
  );
}
