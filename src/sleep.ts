import { Operation } from './api';
import { shift } from './delimited-continutation';
import { Outcome } from './destiny';

export function sleep(durationMillis: number): Operation<void> {
  let timeoutId: any;
  return {
    *begin() {
      yield shift(function*(k) {
        timeoutId = setTimeout(k, durationMillis);
      });
      return { type: 'success' } as Outcome<void>;
    },
    *ensure() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
