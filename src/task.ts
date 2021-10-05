import type { Operation, Task, TaskOptions } from "./api";
import { Continuation, evaluate, Prog } from './continutation';
import { detach } from "./detach";
import { createFuture } from "./future";
import { createTask, TaskInternal } from './internal';

export function run<T>(operation: Operation<T>): Task<T> {
  return evaluate(function*() {
    return yield* externalize(yield* createTask(operation));
  });
}

export function* externalize<T>(internal: TaskInternal<T>): Prog<Task<T>> {
  let resolve: Continuation;
  let reject: Continuation;
  let promise = new Promise<T>((_r, _e) => { resolve = _r; reject = _e; });

  yield* detach(function*() {
    let outcome = yield* internal;
    if (outcome.type === 'success') {
      resolve(outcome.value);
    } else if (outcome.type === 'failure') {
      reject(outcome.error);
    } else {
      reject(new Error('halted'));
    }
  });

  let task: Task<T> = {
    get state() { return internal.state; },
    get options() { return internal.options; },
    then: (...args) => promise.then(...args),
    catch: (...args) => promise.catch(...args),
    finally: (...args) => promise.finally(...args),
    [Symbol.toStringTag]:  '[object Task]',

    run<T>(operation: Operation<T>, options?: TaskOptions): Task<T> {
      if (task.state !== 'pending' && task.state !== 'settling') {
        throw new Error('cannot spawn a child on a task which is not running');
      }
      return evaluate(function*() {
        return yield* externalize(yield* internal.run(operation, {
          scope: task,
          ...options
        }));
      })
    },
    spawn<T>(operation: Operation<T>, options?: TaskOptions): Operation<Task<T>> {
      return {
        *begin() {
          return { type: 'success', value: task.run(operation, options) };
        }
      }
    },
    halt() {
      let { future, resolve } = createFuture<void>();
      evaluate(function*() {
        yield* internal.interrupt();
        yield* internal.halt();
        resolve();
      });
      return future;
    },
    *[Symbol.iterator]() { return yield* internal; }
  };

  return task;
}
