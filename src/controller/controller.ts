import type { Prog } from '../continutation';
import type { Outcome } from '../destiny';
import type { Task } from '../api';

export interface Controller<T> {
  begin(task: Task<T>): Prog<Outcome<T>>;
  interrupt?(): Prog<Outcome<any>>;
  ensure?(): Prog<Outcome<any>>;
}
