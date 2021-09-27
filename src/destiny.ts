import { Continuation, Prog, reset, shift } from './delimited-continutation';

export type Outcome<T> =
  { type: 'success', value: T } |
  { type: 'failure', error: Error } |
  { type: 'halt' };

export interface Destiny<T> {
  [Symbol.iterator](): Prog<Outcome<T>>;
}

export interface NewDestiny<T> {
  destiny: Destiny<T>;
  fulfill(outcome: Outcome<T>): void;
  [Symbol.iterator](): Prog<Outcome<T>>;
}

export function* createDestiny<T>(): Prog<NewDestiny<T>> {
  let outcome: Outcome<T>;
  let watchers: Continuation<Outcome<T>>[] = [];

  let fulfill = yield* reset<Continuation<Outcome<T>>>(function*() {
    outcome = yield* shift<Outcome<T>>(function*(k) { return k; });

    for (let k = watchers.shift(); k; k = watchers.shift()) {
      if (!!k) {
        yield* (function*() { k(outcome)})()
      }
    }
  });

  let destiny: Destiny<T> = {
    *[Symbol.iterator]() {
      if (outcome) {
        return outcome;
      } else {
        return yield* shift<Outcome<T>>(function*(k) { watchers.push(k); });
      }
    }
  }

  return {
    destiny,
    fulfill,
    [Symbol.iterator]() { return destiny[Symbol.iterator](); }
  };
}
