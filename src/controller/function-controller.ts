import type { Operation, OperationFn, Controller, Task } from '../api';
import { Outcome } from '../destiny'

export function createFunctionController<T>(fn: OperationFn<T>, create: (t: Task<T>) => Controller<T>): Controller<T> {
  let delegate: Controller<T>;

  function resolveOp<T>(task: Task<T>, fn: OperationFn<T>): Operation<T> {
    for (let op: Operation<T> = fn; ; op = op(task)) {
      if (typeof op !== 'function') {
        return op;
      }
    }
  }

  return {
    get type() {
      if (delegate) {
        let specifier = delegate.type === 'promise' ? 'async' : delegate.type;
        return `${specifier} function`;
      } else {
        return `function`;
      }
    },
    *begin(task) {
      try {
        delegate = create(task);
        let operation = resolveOp(task, fn);
        task.setLabels({
          ...operation?.labels,
          ...fn.labels
        });
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
