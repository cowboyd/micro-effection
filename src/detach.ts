import { Continuation, Prog, reset, shift } from './continutation';

/**
* decouples the flow of `block` from the current Prog. Detach starts running
* `block` immediately, and returns immediately. This is similar to a
* go-routine.
*/
export function* detach(block: () => Prog): Prog<void> {
  let start = yield* reset<Continuation>(function*() {
    yield* shift(function*(k) { return k; });
    yield* block();
  });
  start();
}
