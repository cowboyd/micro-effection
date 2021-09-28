import { Operation } from "./api";
import { Prog, shift, reset } from "./continutation";
import { createDestiny, Outcome } from "./destiny";
import { createController } from './controller';
import { detach } from './detach';
import { externalize } from "./task";

export interface TaskInternal<T> {
  state: 'pending' | 'settling' | 'completed' | 'errored' | 'halted';
  run<R>(operation: Operation<R>): Prog<TaskInternal<R>>;
  halt(): Prog<Outcome<void>>;
  [Symbol.iterator](): Prog<Outcome<T>>
}

export function* createTask<T>(operation: Operation<T>): Prog<TaskInternal<T>> {
  let state: TaskInternal<T>["state"] = "pending";
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

      function* run<R>(operation?: Operation<R>) {
        let child = yield* createTask(operation);
        children.add(child);
        yield* detach(function*() {
          let result = yield* child;
          children.delete(child);
          if (result.type === 'failure') {
            settle(result);
          }
        });
        return child;
      }

      function* halt() {
        settle({ type: 'halt' });
        return yield* destiny;
      }

      let task: TaskInternal<T> = {
        get state() { return state; },
        run,
        halt,
        *[Symbol.iterator]() { return yield* destiny; }
      } as TaskInternal<T>;

      yield* detach(function*() {
        let result = yield* begin(yield* externalize(task));
        settle(result);
      });

      return task;
    });

    state = 'settling';

    if (ensure) {
      yield* ensure();
    }

    let order = [...children];
    for (let child = order.pop(); child; child = order.pop()) {
      yield* child.halt();
    }

    state = outcome.type === 'success' ? 'completed' : (outcome.type === 'failure' ? 'errored' : 'halted');

    destiny.fulfill(outcome);
  });
}
