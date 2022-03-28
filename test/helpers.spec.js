import {
  getFirstValue,
  getFirstValueAsync,
  getHook,
  getHooks,
  hasOwnCallback,
  isAsyncFunction,
  isFunction,
  isObject,
  validCache,
} from '../src/helpers';

import {
  AFTER_PROPERTY, BEFORE_PROPERTY, PROPERTY,
} from '../src/symbols';

const arrowFunc = () => {};

function syncFunc() {}

// eslint-disable-next-line no-empty-function
async function asyncFunc() {}

describe('isObject()', () => {
  it('Returns true when passed an object', () => {
    expect(isObject({})).toBeTruthy();
    expect(isObject(Object.create(null))).toBeTruthy();
    expect(isObject(null)).toBeFalsy();
  });
});

describe('isFunction()', () => {
  it('Returns true when passed a function', () => {
    expect(isFunction(arrowFunc)).toBeTruthy();
    expect(isFunction(syncFunc)).toBeTruthy();
    expect(isFunction(asyncFunc)).toBeTruthy();
    expect(isFunction(false)).toBeFalsy();
  });
});

describe('isAsyncFunction()', () => {
  it('Returns true when passed an async function', () => {
    expect(isAsyncFunction(arrowFunc)).toBeFalsy();
    expect(isAsyncFunction(syncFunc)).toBeFalsy();
    expect(isAsyncFunction(asyncFunc)).toBeTruthy();
    expect(isAsyncFunction(false)).toBeFalsy();
  });
});

describe('hasOwnCallback()', () => {
  it('Identifies if a callback exists', () => {
    const obj = {
      run() {
        return true;
      },
    };

    expect(hasOwnCallback(obj, 'run')).toBeTruthy();
    expect(hasOwnCallback(obj, 'fake')).toBeFalsy();
    expect(hasOwnCallback(null, 'fake')).toBeFalsy();
  });
});

describe('validCache()', () => {
  it('checks for the minimum required methods', () => {
    expect(validCache(new Map())).toBeTruthy();
    expect(validCache(new WeakMap())).toBeTruthy();
    expect(validCache({
      get() {},
      set() {},
      has() {},
    })).toBeTruthy();
  });
});

describe('getFirstValue()', () => {
  it('Returns the first callback value that isn\'t undefined', () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    const value = getFirstValue(
      () => {
        mock1();
      },
      () => {
        mock2();

        return true;
      },
    );

    expect(value).toBeTruthy();
    expect(mock1).toHaveBeenCalled();
    expect(mock2).toHaveBeenCalled();
  });

  it('Doesn\'t call remaining functions after getting a value', () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    const value = getFirstValue(
      () => {
        mock1();

        return true;
      },
      () => {
        mock2();
      },
    );

    expect(value).toBeTruthy();
    expect(mock1).toHaveBeenCalled();
    expect(mock2).not.toHaveBeenCalled();
  });

  it('Skips over arguments that aren\'t functions', () => {
    const value = getFirstValue( true, () => true );

    expect(value).toBeTruthy();
  });

  it('Returns undefined when none of the callbacks return a value', () => {
    expect(getFirstValue( () => {} )).toBeUndefined();
    expect(getFirstValue()).toBeUndefined();
  });
});

describe('getFirstValueAsync()', () => {
  it('Works with await', async () => {
    await expect(getFirstValueAsync( () => {}, async () => true ) ).resolves.toBeTruthy();
  });
});

describe('getHook()', () => {
  it('Gets the hook from the object', () => {
    const hooks = {
      run() {},
    };

    expect(getHook(hooks, 'run')).toBe(hooks.run);
    expect(getHook(hooks, 'fake')).toBeFalsy();
  });
});

describe('getHooks()', () => {
  it('Gets the hook from the object', () => {
    const hooks = {
      beforeRun() {},
      run() {},
      afterRun() {},
      [ PROPERTY ]() {},
      [ BEFORE_PROPERTY ]() {},
      [ AFTER_PROPERTY ]() {},
    };

    expect(getHooks(hooks, 'run')).toMatchObject(
      expect.objectContaining({
        genericPropHook: expect.any(Function),
        genericBeforeHook: expect.any(Function),
        genericAfterHook: expect.any(Function),
        propHook: expect.any(Function),
        beforeHook: expect.any(Function),
        afterHook: expect.any(Function),
      }),
    );

    expect(getHooks(hooks, 'getName')).toMatchObject(
      expect.objectContaining({
        genericPropHook: expect.any(Function),
        genericBeforeHook: expect.any(Function),
        genericAfterHook: expect.any(Function),
        propHook: false,
        beforeHook: false,
        afterHook: false,
      }),
    );

    expect(getHooks({}, 'run')).toMatchObject(
      expect.objectContaining({
        genericPropHook: false,
        genericBeforeHook: false,
        genericAfterHook: false,
        propHook: false,
        beforeHook: false,
        afterHook: false,
      }),
    );
  });
});
