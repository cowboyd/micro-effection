import type { Labels, Operation, TaskOptions } from "./api";
import { Prog, shift, reset } from "./continutation";
import { createDestiny, Outcome } from "./destiny";
import { createController } from './controller';
import { detach } from './detach';
import { externalize } from "./task";

export interface TaskInternal<T> {
  state: 'running' | 'settling' | 'completed' | 'errored' | 'halted';
  options: TaskOptions;
  labels: Labels;
  run<R>(operation: Operation<R>, options?: TaskOptions): Prog<TaskInternal<R>>;
  halt(): Prog<Outcome<void>>;
  interrupt(): Prog<Outcome<void>>;
  [Symbol.iterator](): Prog<Outcome<T>>
}

export function* createTask<T>(operation: Operation<T>, options?: TaskOptions): Prog<TaskInternal<T>> {
  let state: TaskInternal<T>["state"] = "running";
  let children = new Set<TaskInternal<unknown>>();
  let blockers = new Set<TaskInternal<unknown>>();
  let destiny = yield* createDestiny<T>();

  let labels: Labels = { ...operation?.labels, ...options?.labels };

  if (!labels.name) {
    if (operation?.name) {
      labels.name = operation?.name;
    } else if (!operation) {
      labels.name = 'suspend';
    }
  }

  return yield* reset<TaskInternal<T>>(function*() {
    let { begin, interrupt, ensure } = createController(operation);

    let outcome = yield* shift<Outcome<T>>(function*(settle) {

      function* run<R>(operation?: Operation<R>, options?: TaskOptions) {
        let child = yield* createTask(operation, options);
        children.add(child);
        if (options?.blockParent) {
          blockers.add(child);
        }
        yield* detach(function*() {
          let result = yield* child;
          children.delete(child);
          blockers.delete(child);
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
        labels,
        options: options || {},
        run,
        halt,
        *interrupt() {
          if (interrupt) {
            return yield* interrupt();
          } else {
            return { type: 'success' } as Outcome<void>;
          }
        },
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
      let ensured = yield* ensure();
      if (ensured.type === 'failure') {
        outcome = ensured;
      }
    }

    let order = [...children];
    for (let child = order.pop(); child; child = order.pop()) {
      let teardown = blockers.has(child) ? yield* child :  yield* child.halt();
      if (teardown.type === 'failure') {
        outcome = teardown;
      }
    }

    state = outcome.type === 'success' ? 'completed' : (outcome.type === 'failure' ? 'errored' : 'halted');

    destiny.fulfill(outcome);
  });
}
