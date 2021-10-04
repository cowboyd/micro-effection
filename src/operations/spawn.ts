import type { Task, TaskOptions, Operation } from '../api';

export function spawn<T>(operation?: Operation<T>, options?: TaskOptions): Operation<Task<T>> {
  return function spawn(task: Task) {
    let { scope } = task.options;
    if (!scope) {
      throw new Error('cannot run `spawn` on a task without scope');
    }
    return scope.spawn(operation, options);
  }
}
