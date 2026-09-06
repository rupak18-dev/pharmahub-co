import { useEffect, useState } from "react";

/* Detects which Profile section is currently the primary visible one.
   Uses IntersectionObserver so it works regardless of which element is the
   scroll container, then resolves the active section from each section's
   distance to a reference line in the upper part of the viewport. */
export function useActiveSection(ids, initialIndex = 0) {
  const [active, setActive] = useState(ids[initialIndex]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) return undefined;

    let frame = 0;
    const referenceLine = () => window.innerHeight * 0.4;
    const compute = () => {
      let current = ids[initialIndex];
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= referenceLine()) current = el.id;
      }
      setActive((prev) => (prev === current ? prev : current));
      frame = 0;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };

    const observer = new IntersectionObserver(schedule, { rootMargin: "0px", threshold: 0 });
    elements.forEach((el) => observer.observe(el));
    compute();

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids, initialIndex]);

  return active;
}
