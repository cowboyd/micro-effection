import { Operation } from '../api';
import { perform } from './perform';

export function sleep(durationMillis: number): Operation<void> {
  return perform((resolve) => {
    let timeoutId = setTimeout(resolve, durationMillis);
    return () => clearTimeout(timeoutId);
  })
}
