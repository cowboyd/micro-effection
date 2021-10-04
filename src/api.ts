import type { Controller } from './controller';
import type { Future } from './future';

export { Controller } from './controller';
export type OperationIterator<T> = Generator<Operation<any>, T, any>;
export type OperationFn<T> = (task: Task<T>) => Operation<T>;
export type Operation<T> = PromiseLike<T> | OperationIterator<T> | OperationFn<T> | Controller<T> | Resource<T> | undefined;

export interface TaskOptions {
  blockParent?: boolean;
  scope?: Task;
  readonly yieldScope?: Task;
}

export interface Task<T = any> extends Future<T> {
  state: 'pending' | 'settling' | 'completed' | 'errored' | 'halted';
  options: TaskOptions;
  run<R>(operation?: Operation<R>, options?: TaskOptions): Task<R>;
  spawn<R>(operation?: Operation<R>, options?: TaskOptions): Operation<Task<R>>;
  halt(): Future<void>;
}

export interface Resource<T> {
  name?: string;
  init(resourceTask: Task, initTask: Task): OperationIterator<T>;
}
