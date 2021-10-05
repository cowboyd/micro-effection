import type { Labels, Operation } from "../api";
import type { Outcome } from "../destiny";
import { shift } from "../continutation";

export type Setup<T> = (resolve: Resolve<T>, reject: Reject) => Teardown;
export type Teardown = (() => void) | void;
export type Resolve<T> = (value: T) => void;
export type Reject = (error: Error) => void;

export function perform<T>(setup: Setup<T>, labels?: Labels): Operation<T> {
  let teardown: Teardown;

  return {
    labels: { name: 'perform', ...labels },
    *begin() {
      return yield* shift(function*(k) {
        let resolve: Resolve<T> = (value) => k({ type: 'success', value });
        let reject: Reject = (error: Error) => k({ type: 'failure', error });
        return protect(() => teardown = setup(resolve, reject));
      });
    },
    *ensure() {
      if (teardown) {
        return protect(teardown);
      } else {
        return { type: 'success' } as Outcome<void>;
      }
    }
  }
}

function protect<T>(fn: () => T): Outcome<T> {
  try {
    return { type: 'success', value: fn() };
  } catch (error) {
    return { type: 'failure', error: error as Error };
  }
}
