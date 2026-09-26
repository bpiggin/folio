import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the user has asked the system to reduce motion; decorative animation is skipped. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
