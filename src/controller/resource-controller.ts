import type { Resource, Task } from '../api';
import { createTask, TaskInternal } from '../internal';
import type { Controller } from './controller';

export function createResourceController<T>(resource: Resource<T>): Controller<T> {
  let resourceTask: Task;
  let initTask: TaskInternal<T>;

  return {
    *begin(task) {
      let { scope } = task.options;
      if(!scope) {
        throw new Error('cannot spawn resource in task which has no resource scope');
      }
      resourceTask = scope.run<undefined>(undefined);

      initTask = yield* createTask<T>(task => resource.init(resourceTask, task), {
        yieldScope: resourceTask
      });

      let init = yield* initTask;

      if (init.type !== 'success')  {
        yield* resourceTask.halt();
      }

      return init;
    },

    *interrupt() {
      return yield* resourceTask.halt();
    },

    *ensure() {
      return yield* initTask.halt();
    }
  }
}
