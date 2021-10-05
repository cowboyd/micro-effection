import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep } from '../../src/index';

describe('sleep', () => {
  it('suspends for a given amount of time', async () => {
    let root = run(function*() {
      yield sleep(10);
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(root.state).toEqual('running');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(root.state).toEqual('completed');
  });

  it('suspends for zero seconds', async () => {
    let root = run(function*() {
      yield sleep(0);
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(root.state).toEqual('completed');
  });

  it('suspends indefinitely', async () => {
    let root = run(function*() {
      yield sleep();
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(root.state).toEqual('running');
  });

  it('applies labels', () => {
    expect(run(sleep()).labels).toEqual({ name: 'sleep', duration: 'forever' });
    expect(run(sleep(0)).labels).toEqual({ name: 'sleep', duration: 0 });
    expect(run(sleep(100)).labels).toEqual({ name: 'sleep', duration: 100 });
  });
});
