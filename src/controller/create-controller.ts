import type { Operation, Resource, Task } from '../api';
import type { Outcome } from '../destiny';
import type { Controller } from './controller';

import { shift } from '../continutation';
import { createIteratorController } from './iterator-controller';
import { createResourceController }  from './resource-controller';

export function createController<T>(operation: Operation<T>): Controller<T> {
  if (isPromise<T>(operation)) {
    return createPromiseController(operation);
  } else if (typeof operation === 'function') {
    return createFunctionController((task) => createController(operation(task)));
  } else if (isController(operation)) {
    return operation as Controller<T>;
  } else if (isGenerator<T>(operation)) {
    return createIteratorController<T>(operation as Generator<Operation<any>, T>);
  } else if (isResource(operation)) {
    return createResourceController<T>(operation);
  } else if (operation == null) {
    return createSuspendController();
  } else {
    throw new Error(`unknown operation: ${operation}`);
  }

}

function createPromiseController<T>(promise: PromiseLike<T>): Controller<T> {
  return {
    *begin() {
      return yield* shift<Outcome<T>>(function*(k) {
        promise.then(
          value => k({ type: 'success', value }),
          error => k({ type: 'failure', error })
        )
      })
    }
  }
}

function createFunctionController<T>(create: (t: Task<T>) => Controller<T>): Controller<T> {
  let delegate: Controller<T>;
  return {
    *begin(task) {
      try {
        delegate = create(task);
      } catch (error) {
        return { type: 'failure', error } as Outcome<T>;
      }
      return yield* delegate.begin(task);
    },
    *interrupt() {
      if (delegate && delegate.interrupt) {
        return yield* delegate.interrupt();
      } else {
        return { type: 'success' } as Outcome<T>;
      }
    },
    *ensure() {
      if (delegate && delegate.ensure) {
        return yield* delegate.ensure();
      } else {
        return { type: 'success' } as Outcome<T>;
      }
    }
  }
}

function createSuspendController<T>(): Controller<T> {
  return {
    *begin() {
      return yield* shift<Outcome<T>>(function*() {});
    }
  }
}

export function isPromise<T>(value: any): value is PromiseLike<T> {
  return value && typeof(value.then) === 'function';
}

export function isGenerator<T>(value: any): value is Generator<T> {
  return value && typeof(value.next) === 'function';
}

export function isController(value: any): value is Controller<unknown> {
  return value && typeof(value.begin) === 'function'
}

export function isResource<T>(value: any): value is Resource<T> {
  return !!value && (
    typeof value.init === 'function' ||
      isPromise<T>(value.init) ||
      isGenerator<T>(value.init) ||
      isController(value.init));
}
