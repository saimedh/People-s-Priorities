import { useEffect, useRef, useState } from 'react';

/**
 * Animated counter that counts up from 0 to the target value
 */
export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1500, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    if (value === undefined || value === null) return;
    const target = parseFloat(value);
    startTime.current = null;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration, decimals]);

  return (
    <span className="count-up">
      {prefix}
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}
