export type Continuation<T = any, R = any> = (value?: T) => R;

export interface Prog<T = any> extends Iterator<Control, T, any> {
  [Symbol.iterator](): Iterator<Control, T, any>;
}

export interface Shift {
  type: 'shift';
  block: (k: Continuation) => Prog;
}

export interface Reset {
  type: 'reset';
  block: () => Prog;
}

export type Control = Reset | Shift;

export function* reset<T>(block: () => Prog): Prog<T> {
  return yield { type: 'reset', block };
}

export function* shift<T>(block: (k: Continuation<T>) => Prog): Prog<T> {
  return yield { type: 'shift', block };
}

export function evaluate<T>(block: () => Prog<T>, done: Continuation = v => v, value?: unknown): T {
  let prog = block();
  let next = prog.next(value);
  if (next.done) {
    return done(next.value);
  } else {
    let control = next.value;
    if (control.type === 'reset') {
      return evaluate(control.block, v => evaluate(() => prog, done, v));
    } else {
      let k: Continuation = value => evaluate(() => prog, v => v, value);
      return evaluate(() => control.block(k), done);
    }
  }
}
