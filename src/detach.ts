import { Continuation, Prog, reset, shift } from './delimited-continutation';

export function* detach(block: () => Prog): Prog<void> {
  let start: Continuation = yield reset(function*() {
    yield shift(function*(k) { return k; });
    yield* block();
  });
  start();
}
