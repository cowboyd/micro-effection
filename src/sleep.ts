import { Operation } from './api';
import { shift } from './continutation';
import { Outcome } from './destiny';

export function sleep(durationMillis: number): Operation<void> {
  let timeoutId: any;
  return {
    *begin() {
      return yield* shift<Outcome<void>>(function*(k) {
        let done = () => k({ type: 'success'} as Outcome<void>)
        timeoutId = setTimeout(done, durationMillis);
      });
    },
    *ensure() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return { type: "success", value: undefined };
    }
  }
}
