import { evaluate, Prog } from "./continutation";
import { createDestiny, Outcome } from "./destiny";


/**
 * A Future represents a value which may or may not be available yet. It is
 * similar to a JavaScript Promise, except that it can resolve synchronously.
 *
 * See [the Futures guide](https://frontside.com/effection/docs/guides/futures)
 * for a more detailed description of futures and how they work.
 *
 * A Future may resolve to *three* different states. A Future can either become
 * `completed` with a value, it can become `errored` with an Error or it can
 * become `halted`, meaning it was prematurely cancelled.
 *
 * A Future can be created via the {@link createFuture} function, or via the
 * The `resolve`, `reject` and `halt` functions on {@link Future}.
 *
 * See also the slimmed down {@link FutureLike} interface.
 */
export interface Future<T> extends Promise<T> {
  [Symbol.iterator](): Prog<Outcome<T>>;
}

export interface NewFuture<T> {
  future: Future<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

export function createFuture<T>(): NewFuture<T> {
  let { fulfill, destiny } = evaluate(() => createDestiny<T>());

  let promise = new Promise<T>((resolve, reject) => evaluate(function*() {
    let outcome = yield* destiny;
    if (outcome.type === 'success') {
      resolve(outcome.value);
    } else if (outcome.type === 'failure') {
      reject(outcome.error);
    } else {
      reject(new Error('halted'));
    }
  }))

  let future: Future<T> = {
    then: (...args) => promise.then(...args),
    catch: (...args) => promise.catch(...args),
    finally: (...args) => promise.finally(...args),
    [Symbol.toStringTag]: 'Future',
    *[Symbol.iterator]() { return yield* destiny; }
  };

  let produce = (outcome: Outcome<T>) => fulfill(outcome);

  let resolve = (value: T) => produce({ type: 'success', value });

  let reject = (error: Error) => produce({ type: 'failure', error });

  return { future, resolve, reject };
}

export const Future = {
  resolve<T>(value: T): Future<T> {
    let { future, resolve } = createFuture<T>();
    resolve(value);
    return future;
  },
  reject<T>(error: Error): Future<T> {
    let { future, reject } = createFuture<T>();
    reject(error);
    return future;
  }
}

export function isFuture(value: unknown): value is Future<unknown> {
  return !!value && ((value as any)[Symbol.toStringTag] === 'Future');
}
