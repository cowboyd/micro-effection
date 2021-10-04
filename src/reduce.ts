import type { Prog } from './continutation';

export interface Reducer<T,R> {
  (current: R, item: T): Prog<R>;
}
export function* reduce<T, R>(items: T[],reducer: Reducer<T,R>, initial: R): Prog<R> {
  let result = initial;
  for (let item of items) {
    result = yield* reducer(result, item);
  }
  return result;
}
