import type { Controller } from './controller';

export { Controller } from './controller';
export type OperationIterator<T> = Generator<Operation<any>, T, any>;
export type OperationFn<T> = (task: Task<T>) => Operation<T>;
export type Operation<T> = PromiseLike<T> | OperationIterator<T> | OperationFn<T> | Controller<T> | undefined;

export interface Task<T = any> extends Promise<T> {
  state: 'pending' | 'settling' | 'completed' | 'errored' | 'halted';
  run<R>(operation?: Operation<R>): Task<R>;
  halt(): Promise<void>;
}
