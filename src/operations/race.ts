import type { Operation } from '../api';
import { createTask, TaskInternal } from '../internal';
import { shift } from '../continutation';
import { detach } from '../detach';
import { Outcome } from '../destiny';

/**
 * Race the given operations against each other and return the value of
 * whichever operation returns first. This has the same purpose as
 * [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
 *
 * If an operation become errored first, then `race` will fail with this error.
 * After the first operation wins the race, all other operations will become
 * halted and therefore cannot throw any further errors.
 *
 * ### Example
 *
 * ```typescript
 * import { main, race, fetch } from 'effection';
 *
 * main(function*() {
 *  let fastest = yield race([fetch('http://google.com').text(), fetch('http://bing.com').text()]);
 *  // ...
 * });
 * ```
 *
 * @typeParam T the type of the operations that race against each other
 * @param operations a list of operations to race against each other
 * @returns the value of the fastest operation
 */
export function race<T>(operations: Operation<T>[]): Operation<T> {
  let contestants = new Set<TaskInternal<T>>();

  return {
    labels: { name: 'race', count: operations.length },
    *begin(task) {
      return yield* shift(function*(win) {
        for (let operation of operations) {
          let contestant = yield* createTask(operation, { scope: task.options.scope });
          contestants.add(contestant);
          yield* detach(function*() {
            win(yield* contestant);
          });
        }
      })
    },
    *ensure() {
      let outcome: Outcome<void> = { type: 'success' } as Outcome<void>;
      for (let contestant of contestants) {
        let result = yield* contestant.halt();
        if (result.type === 'failure') {
          outcome = result;
        }
      }
      return outcome;
    }
  }
}
