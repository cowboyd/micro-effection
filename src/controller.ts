import { Operation } from './api';
import { Prog, shift } from './delimited-continutation';
import { Outcome } from './destiny';
import { createIteratorController } from './iterator-controller';

export interface Controller<T> {
  begin(): Prog<Outcome<T>>;
  ensure?(): Prog<void>;
}
export function createController<T>(operation: Operation<T>): Controller<T> {
  if (isPromise(operation)) {
    return createPromiseController(operation);
  } else if (typeof operation === 'function') {
    return createFunctionController(() => createController(operation()));
  } else if (isController(operation)) {
    return operation;
  } else {
    return createIteratorController(operation);
  }
}

function createPromiseController<T>(promise: PromiseLike<T>): Controller<T> {
  return {
    *begin() {
      return yield shift(function*(k) {
        promise.then(
          value => k({ type: 'success', value }),
          error => k({ type: 'failure', error })
        )
      })
    }
  }
}

function createFunctionController<T>(create: () => Controller<T>): Controller<T> {
  let delegate: Controller<T>;
  return {
    *begin() {
      try {
        delegate = create();
      } catch (error) {
        return { type: 'failure', error } as Outcome<T>;
      }
      return yield* delegate.begin();
    },
    *ensure() {
      if (delegate && delegate.ensure) {
        return yield* delegate.ensure();
      }
    }
  }
}

export function isPromise(value: any): value is PromiseLike<unknown> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}

export function isController(value: any): value is Controller<unknown> {
  return value && typeof(value.begin) === 'function'
}
