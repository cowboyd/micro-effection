import { Operation } from "./api";
import { Prog, shift, reset } from "./continutation";
import { createDestiny, Outcome } from "./destiny";
import { createController } from './controller';
import { detach } from './detach';

export interface TaskInternal<T> {
  status: 'pending' | 'settling' | 'completed' | 'errored' | 'halted';
  halt(): Prog<void>;
  [Symbol.iterator](): Prog<Outcome<T>>
}

export function* createTask<T>(operation: Operation<T>): Prog<TaskInternal<T>> {
  let status: TaskInternal<T>["status"] = "pending";
  let children = new Set<TaskInternal<unknown>>();

  let destiny = yield* createDestiny<T>();

  return yield* reset<TaskInternal<T>>(function*() {
    let { begin, ensure } = createController(operation);

    let outcome = yield* shift<Outcome<T>>(function*(k) {
      let settled = false;

      function settle(result: Outcome<T>) {
        if (!settled) {
          settled = true;
          k(result);
        }
      }

      yield* detach(function*() {
        let result = yield* begin();
        settle(result);
      });

      return {
        get status() { return status; },
        *halt() {
          settle({ type: 'halt' });
          yield* destiny;
        },
        [Symbol.iterator]() { return destiny[Symbol.iterator](); }
      } as TaskInternal<T>;
    });

    status = 'settling';

    if (ensure) {
      yield* ensure();
    }

    let order = [...children];
    for (let child = order.shift(); child; child = order.shift()) {
      yield* child.halt();
    }

    status = outcome.type === 'success' ? 'completed' : (outcome.type === 'failure' ? 'errored' : 'halted');

    destiny.fulfill(outcome);
  });
}
