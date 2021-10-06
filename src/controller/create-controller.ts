import type { Operation, OperationFn, Resource, Task } from '../api';
import type { Outcome } from '../destiny';
import type { Controller } from './controller';

import { shift } from '../continutation';
import { createIteratorController } from './iterator-controller';
import { createResourceController }  from './resource-controller';
import { createFunctionController } from './function-controller';
import { Future, isFuture } from '../future';

export function createController<T>(operation: Operation<T>): Controller<T> {
  if (isFuture(operation) || isTask(operation)) {
    return createFutureController(operation as Future<T>);
  } else if (isPromise<T>(operation)) {
    return createPromiseController(operation);
  } else if (typeof operation === 'function') {
    return createFunctionController(operation, (task) => createController(operation(task)));
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

function createFutureController<T>(future: Future<T>): Controller<T> {
  return {
    *begin() { return yield* future; }
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

export function isTask<T>(value: any): value is Task<T> {
  return value && value[Symbol.toStringTag] === 'Task';
}

export function isResource<T>(value: any): value is Resource<T> {
  return !!value && (
    typeof value.init === 'function' ||
      isPromise<T>(value.init) ||
      isGenerator<T>(value.init) ||
      isController(value.init));
}
