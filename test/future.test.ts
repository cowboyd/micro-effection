import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { createFuture, Future } from '../src/index';

describe('Future', () => {
  it('can be resolved', async () => {
    let { future, resolve } = createFuture();
    resolve(123);
    await expect(future).resolves.toEqual(123);
  });

  it('can be rejected', async () => {
    let error = new Error('boom');
    let { future, reject } = createFuture();
    reject(error);
    await expect(future).rejects.toEqual(error);
  });

  it('can make resolved future', async () => {
    let future = Future.resolve(123);
    await expect(future).resolves.toEqual(123);
  });

  it('can make rejected future', async () => {
    let error = new Error('boom');
    let future = Future.reject(error);
    await expect(future).rejects.toEqual(error);
  });
});
