import type { Controller } from './controller';
import type { Future } from './future';

export type Labels = Record<string, string | number | boolean>;
export interface Labelled {
  name?: string;
  labels?: Labels;
}

export { Controller } from './controller';
export interface OperationPromise<T> extends PromiseLike<T>, Labelled {}
export interface OperationIterator<T> extends Generator<Operation<any>, T, any>, Labelled {}
export interface OperationController<T> extends Controller<T>, Labelled {}
export interface OperationFn<T> extends Labelled {
  (task: Task<T>): Operation<T>;
}

export type Operation<T> =
  OperationPromise<T> |
  OperationIterator<T> |
  OperationFn<T> |
  OperationController<T> |
  Resource<T> |
  undefined;

export interface TaskOptions {
  blockParent?: boolean;
  scope?: Task;
  readonly yieldScope?: Task;
}

export interface Task<T = any> extends Future<T> {
  state: 'running' | 'settling' | 'completed' | 'errored' | 'halted';
  options: TaskOptions;
  labels: Labels;
  run<R>(operation?: Operation<R>, options?: TaskOptions): Task<R>;
  spawn<R>(operation?: Operation<R>, options?: TaskOptions): Operation<Task<R>>;
  halt(): Future<void>;
}

export interface Resource<T> extends Labelled {
  init(resourceTask: Task, initTask: Task): OperationIterator<T>;
}
