import type { Controller } from './controller';
import type { Operation, OperationIterator } from "../api";
import type { Prog } from '../continutation';
import type { Outcome } from '../destiny';

import { createTask, TaskInternal } from '../internal';

type Signal = { abort: boolean; };

export function createIteratorController<T>(generator: OperationIterator<T>): Controller<T> {
  let yieldingTo: TaskInternal<unknown>;
  let signal: Signal = { abort: false };

  function* iterate(initial: () => IteratorResult<Operation<unknown>, T>, signal: Signal): Prog<Outcome<T>> {
    let next = initial;
    while (true) {
      try {
        if (signal.abort) {
          return { type: 'halt' };
        }
        let current = next();
        if (current.done) {
          let { value } = current;
          return { type: 'success', value };
        } else {
          let operation = current.value;
          yieldingTo = yield* createTask(operation);
          let outcome = yield* yieldingTo;
          if (outcome.type === 'success') {
            let { value } = outcome;
            next = () => generator.next(value);
          } else if (outcome.type === 'failure') {
            let { error } = outcome;
            next = () => generator.throw(error);
          } else {
            next = () => generator.throw(new Error('halted'));
          }
        }
      } catch (error) {
        return { type: 'failure', error: error as Error }
      }
    }
  }

  return {
    *begin(): Prog<Outcome<T>> {
      return yield* iterate(() => generator.next(), signal);
    },

    *ensure(): Prog<Outcome<any>> {
      signal.abort = true;
      if (yieldingTo) {
        yield* yieldingTo.halt();
      }
      return yield* iterate(() => generator.return({} as unknown as T), { abort: false })
    },
  }
}
