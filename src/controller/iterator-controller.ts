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
    while (!signal.abort) {
      let current: IteratorResult<Operation<unknown>, T>;
      try {
        current = next();
      } catch (error) {
        return { type: 'failure', error: error as Error }
      }
      if (current.done) {
        return { type: 'success', value: current.value };
      } else {
        yieldingTo = yield* createTask(current.value);
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
    }
    return { type: 'halt' };
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
