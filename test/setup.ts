import { Operation } from '../src';
import { sleep } from '../src/operations/sleep';

export function* createNumber(value: number): Operation<number> {
  yield sleep(1);
  return value;
}

export function *blowUp(): Operation<void> {
  yield sleep(1);
  throw new Error('boom');
}

export function *asyncResolve(duration: number, value: string): Operation<string> {
  yield sleep(duration);
  return value;
}

export function *asyncReject(duration: number, value: string): Operation<string> {
  yield sleep(duration);
  throw new Error(`boom: ${value}`);
}

export function *syncResolve(value: string): Operation<string> {
  return value;
}

export function *syncReject(value: string): Operation<string> {
  throw new Error(`boom: ${value}`);
}
