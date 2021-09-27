import type { Controller } from './controller';

export { Controller } from './controller';
export type OperationIterator<T> = Generator<Operation<T>, T, any>;
export type OperationFn<T> = () => Operation<T>;
export type Operation<T> = PromiseLike<T> | OperationIterator<T> | OperationFn<T> | Controller<T> | undefined;

export interface Task<T> extends Promise<T> {
  status: 'pending' | 'settling' | 'completed' | 'errored' | 'halted';
  halt(): Promise<void>;
}
