import { describe, it } from 'mocha';
import expect from 'expect';

import { createDestiny } from '../src/destiny';
import { evaluate, Prog, shift, reset } from '../src/continutation';
import { detach } from '../src/detach';

describe('Destiny', () => {
  it('can be fulfilled', () => {
    evaluate(function*() {
      let { fulfill, destiny } = yield* createDestiny<number>();
      fulfill({ type: 'success', value: 123 });
      expect(yield* destiny).toEqual({ type: 'success', value: 123 });
    });
  });

  it('only ever settles to a single outcome', () => {
    evaluate(function*() {
      let { fulfill, destiny } = yield* createDestiny<number>();
      fulfill({ type: 'success', value: 123 });
      fulfill({ type: 'halt' });
      expect(yield* destiny).toEqual({ type: 'success', value: 123 });
    });

  });
  it('can have multiple observers all of which resolve exactly once', () => {
    evaluate(function*() {
      let { fulfill, destiny } = yield* createDestiny();

      function* createObserver(): Prog<{ calls: number }> {
        return yield* reset(function*() {
          yield* shift(function*() {
            let state = { calls: 0 };

            yield* detach(function*() {
              yield* destiny
              state.calls++;
            })
            return state;
          })
        })
      }

      let first = yield* createObserver();
      let second = yield* createObserver();

      fulfill({ type: 'success', value: 10 });
      fulfill({ type: 'success', value: 10 });
      fulfill({ type: 'success', value: 10 });

      expect(first.calls).toEqual(1);
      expect(second.calls).toEqual(1);
    })

  });
});
