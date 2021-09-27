import type { Prog } from '../continutation';
import type { Outcome } from '../destiny';

export interface Controller<T> {
  begin(): Prog<Outcome<T>>;
  ensure?(): Prog<void>;
}
