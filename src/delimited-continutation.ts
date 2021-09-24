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

export function reset(block: () => Prog): Reset {
  return { type: 'reset', block };
}

export function shift(block: (k: Continuation) => Prog): Shift {
  return { type: 'shift', block };
}

export function evaluate(block: () => Prog, done: Continuation = v => v, value?: unknown): any {
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
