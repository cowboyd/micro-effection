import { Operation, Task } from "./api";
import { Continuation, evaluate, Prog } from './continutation';
import { detach } from "./detach";
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

  return {
    get state() { return internal.state; },
    then: (...args) => promise.then(...args),
    catch: (...args) => promise.catch(...args),
    finally: (...args) => promise.finally(...args),
    [Symbol.toStringTag]:  '[object Task]',

    run<T>(operation: Operation<T>): Task<T> {
      return evaluate(function*() {
        return yield* externalize(yield* internal.run(operation));
      })
    },
    halt() {
      return new Promise(resolve => {
        evaluate(function*() {
          yield* internal.halt();
          resolve();
        })
      });
    }
  }
}
