import { Operation } from '../api';
import { perform } from './perform';

export function sleep(durationMillis?: number): Operation<void> {
  return perform((resolve) => {
    if (durationMillis != null) {
      let timeoutId = setTimeout(resolve, durationMillis);
      return () => clearTimeout(timeoutId);
    }
  }, {
    name: 'sleep',
    duration: durationMillis == null ? 'forever' : durationMillis
  });
}
