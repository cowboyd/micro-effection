import { Operation, Task } from "./api";
import { Continuation, evaluate } from './delimited-continutation';
import { detach } from "./detach";
import { createTask, TaskInternal } from './internal';

export function run<T>(operation: Operation<T>): Task<T> {
  let resolve: Continuation;
  let reject: Continuation;
  let promise = new Promise<T>((_r, _e) => { resolve = _r; reject = _e; });

  return evaluate(function*() {
    let internal: TaskInternal<T> = yield* createTask(operation);

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
      get status() { return internal.status; },
      then: (...args) => promise.then(...args),
      catch: (...args) => promise.catch(...args),
      finally: (...args) => promise.finally(...args),
      [Symbol.toStringTag]:  '[object Task]',
      halt() {
        return new Promise(resolve => {
          evaluate(function*() {
            yield* internal.halt();
            resolve();
          })
        });
      }
    } as Task<T>
  });

}
