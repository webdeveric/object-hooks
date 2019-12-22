import {
  isObject,
  isFunction,
  isAsyncFunction,
  supportsCallback,
  callBefore,
  callAfter,
  callCustom,
  capitalize,
  lcfirst,
  ucfirst,
  toPascalCase,
} from '../src/helpers';

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

describe('supportsCallback()', () => {
  it('Identifies if a callback exists', () => {
    const obj = {
      run() {
        return true;
      },
    };

    expect(supportsCallback(obj, 'run')).toBeTruthy();
    expect(supportsCallback(obj, 'fake')).toBeFalsy();
    expect(supportsCallback(null, 'fake')).toBeFalsy();
  });
});

describe('callBefore()', () => {
  it('Calls the before method', () => {
    const mock = jest.fn();

    const hooks = {
      before() {
        mock();
      },
    };

    callBefore(hooks, 'run');

    expect(mock).toHaveBeenCalled();
  });

  it('Calls custom before method', () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    const hooks = {
      before() {
        mock1();
      },
      beforeRun() {
        mock2();
      },
    };

    callBefore(hooks, 'run');

    expect(mock1).not.toHaveBeenCalled();
    expect(mock2).toHaveBeenCalled();
  });
});

describe('callAfter()', () => {
  it('Calls the after method', () => {
    const mock = jest.fn();

    const hooks = {
      after() {
        mock();
      },
    };

    callAfter(hooks, 'run');

    expect(mock).toHaveBeenCalled();
  });

  it('Calls custom after method', () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    const hooks = {
      after() {
        mock1();
      },
      afterRun() {
        mock2();
      },
    };

    callAfter(hooks, 'run');

    expect(mock1).not.toHaveBeenCalled();
    expect(mock2).toHaveBeenCalled();
  });
});

describe('callCustom()', () => {
  it('Calls the custom prefix method', () => {
    const mock = jest.fn();

    const hooks = {
      test() {
        mock();
      },
    };

    callCustom(hooks, 'test', 'run');

    expect(mock).toHaveBeenCalled();
  });

  it('Calls the custom method', () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    const hooks = {
      test() {
        mock1();
      },
      testRun() {
        mock2();
      },
    };

    callCustom(hooks, 'test', 'run');

    expect(mock1).not.toHaveBeenCalled();
    expect(mock2).toHaveBeenCalled();
  });
});

describe('capitalize', () => {
  it('Capitalizes a word', () => {
    expect(capitalize('TEST')).toBe('Test');
    expect(capitalize('Test')).toBe('Test');
    expect(capitalize('test')).toBe('Test');
  });
});

describe('lcfirst', () => {
  it('Make a string\'s first character lowercase', () => {
    expect(lcfirst('TEST')).toBe('tEST');
    expect(lcfirst('Test')).toBe('test');
    expect(lcfirst('test')).toBe('test');
  });
});

describe('ucfirst', () => {
  it('Make a string\'s first character uppercase', () => {
    expect(ucfirst('TEST')).toBe('TEST');
    expect(ucfirst('TeSt')).toBe('TeSt');
    expect(ucfirst('tesT')).toBe('TesT');
  });
});

describe('toPascalCase', () => {
  it('Handles snake case', () => {
    expect(toPascalCase('do_something_cool')).toBe('DoSomethingCool');
  });

  it('Handles camel case', () => {
    expect(toPascalCase('doSomethingCool')).toBe('DoSomethingCool');
  });

  it('Handles complex sentences', () => {
    expect(toPascalCase('Hello world! How are you today?')).toBe(
      'HelloWorldHowAreYouToday'
    );
  });

  it('Handles numbers', () => {
    expect(toPascalCase('abc123def')).toBe('Abc123Def');
  });

  it('Handles symbols', () => {
    expect(toPascalCase(Symbol('test'))).toBe('SymbolTest');
  });

  it('Supports custom word mapping', () => {
    const wordMap = {
      io: 'IO',
      id: 'Id',
    };

    expect(toPascalCase('disk_io', wordMap)).toBe('DiskIO');
    expect(toPascalCase('user_id', wordMap)).toBe('UserId');
    expect(toPascalCase('user_id', {})).toBe('UserId');
  });
});
