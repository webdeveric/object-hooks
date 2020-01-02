import { objectHooks, EVERY_PROPERTY } from '../src/objectHooks';

describe('objectHooks()', () => {
  describe('Handles properties that are not functions', () => {
    it('Returns the property', () => {
      const zero = Symbol('Zero');

      const obj = {
        [ zero ]: 'Zero',
        [ 1 ]: 'One',
        name: 'Eric',
      };

      const demo = objectHooks(obj);

      expect(demo.name).toBe('Eric');
      expect(demo[ zero ]).toBe('Zero');
      expect(demo[ 1 ]).toBe('One');
      expect(demo.age).toBeUndefined();
    });

    it('Getters work like normal properties', () => {
      const demo = objectHooks({
        realName: 'Eric',
        get name() { return this.realName; },
      }, {
        name( prop ) {
          return prop.toLowerCase();
        },
      });

      expect(demo.name).toBe('eric');
    });

    it('Calls a callback', () => {
      const person = objectHooks(
        {
          name: 'Eric',
          [Symbol.toPrimitive](hint) {
            if ( hint === 'string') {
              return this.name;
            }

            return 0;
          },
        },
        {
          name( prop ) {
            return `WebDev${prop}`;
          },
          symbolSymbolToPrimitive(prop) {
            return (...args) => {
              const value = prop.call(this, ...args);

              return `WebDev${value}`;
            };
          },
        });

      expect(`${person}`).toBe('WebDevEric');
      expect(person.name).toBe('WebDevEric');
    });
  });

  describe('arguments', () => {
    it('obj must be an object', () => {
      expect(() => {
        objectHooks({});
        objectHooks(Object.create(null));
      }).not.toThrow();

      expect(() => {
        objectHooks(null);
      }).toThrow();
    });

    it('hooks must be an object', () => {
      expect(() => {
        objectHooks({}, {});
        objectHooks({}, undefined);
      }).not.toThrow();

      expect(() => {
        objectHooks({}, null);
      }).toThrow();
    });
  });

  describe('hooks', () => {
    describe('EVERY_PROPERTY', () => {
      it('Is called for every property.', () => {
        const mock = jest.fn();

        const person = {
          name: 'Eric',
          age: 100,
        };

        const demo = objectHooks(person, {
          [ EVERY_PROPERTY ](/*prop, propName, cache */) {
            mock();
          },
        });

        expect(demo.name).toBe('Eric');

        expect(demo.age).toBe(100);

        expect(mock).toHaveBeenCalledTimes(2);
      });

      it('Can return a new value.', () => {
        const person = {
          age: 100,
        };

        const demo = objectHooks(person, {
          [ EVERY_PROPERTY ](prop, propName) {
            if ( propName === 'name' ) {
              return  'Eric';
            }

            if ( propName === 'age' ) {
              return prop + 1;
            }
          },
        });

        expect(demo.name).toBe('Eric');

        expect(demo.fake).toBeUndefined();

        expect(demo.age).toBe(101);
      });
    });

    describe('Exact propName hook', () => {
      it('Can return a different value', () => {
        const ageMock = jest.fn();
        const nameMock = jest.fn();

        const person = {
          name: 'Eric',
          age: 100,
          getName() {
            return this.name;
          },
        };

        const demo = objectHooks(person, {
          age(/* prop, cache */) {
            // Do nothing
            ageMock();
          },
          getName(prop /*, cache */) {
            nameMock();

            return (...args) => {
              return prop.call(this, ...args) + '!';
            };
          },
        });

        expect(demo.age).toBe(100);
        expect(demo.age).toBe(100);
        expect(ageMock).toHaveBeenCalledTimes(2);

        expect(demo.getName()).toBe('Eric!');
        expect(demo.getName()).toBe('Eric!');
        expect(nameMock).toHaveBeenCalledTimes(2);
      });

      it('Can cache values', () => {
        const mock = jest.fn();

        const cache = new Map();

        const person = {
          name: 'Eric',
          getName() {
            return this.name;
          },
        };

        const demo = objectHooks(person, {
          getName(prop, cache) {
            mock();

            const callback = (...args) => {
              return prop.call(this, ...args) + '!';
            };

            cache.set('getName', callback);

            return callback;
          },
        }, cache);

        expect(cache.has('getName')).toBeFalsy();

        expect(demo.getName()).toBe('Eric!');

        expect(cache.has('getName')).toBeTruthy();

        expect(demo.getName()).toBe('Eric!');

        expect(mock).toHaveBeenCalledTimes(1);
      });
    });

    it('Callbacks have correct \'this\'', () => {
      const person = {
        name: 'Eric',
      };

      const demo = objectHooks(person, {
        name(prop) {
          expect(this === person).toBeTruthy();

          return prop;
        },
      });

      expect(demo.name).toBe('Eric');
    });

    it('before()', () => {
      const mock = jest.fn();

      const demo = objectHooks(
        {
          run() {},
        },
        {
          before() {
            mock();
          },
        }
      );

      demo.run();

      expect(mock).toHaveBeenCalled();
    });

    it('before() short circuit', async () => {
      const shortCircuit = 'short circuit';

      const demo = objectHooks(
        {
          run() {},
          async getName() {
            const name = await Promise.resolve('Eric');

            return name;
          },
        },
        {
          before() {
            return shortCircuit;
          },
        }
      );

      const results = demo.run();

      expect(results).toBe(shortCircuit);
      await expect(demo.getName()).resolves.toBe(shortCircuit);
    });

    it('before() arguments', () => {
      const obj = {
        run(...args) {
          return args;
        },
      };

      const demo = objectHooks(
        obj,
        {
          beforeRun({
            target,
            thisArg,
            prop,
            func,
            args,
            callback, // This function is already bound to the correct object and arguments.
          }) {
            expect(target).toBe(obj);
            expect(thisArg).toBeInstanceOf(Object);
            expect(prop).toBe(func);
            expect(args).toStrictEqual([ 1, 2, 3 ]);
            expect(callback()).toStrictEqual([ 1, 2, 3 ]);
          },
        }
      );

      demo.run(1, 2, 3);
    });

    it('after()', () => {
      const mock = jest.fn();

      const demo = objectHooks(
        {
          run() {
            return true;
          },
        },
        {
          after({ returnValue }) {
            mock();

            expect(returnValue).toBe(true);
          },
        }
      );

      expect(demo.run()).toBeTruthy();

      expect(mock).toHaveBeenCalled();
    });

    it('after() arguments', () => {
      const obj = {
        run(...args) {
          return args;
        },
      };

      const demo = objectHooks(
        obj,
        {
          afterRun({
            target,
            thisArg,
            prop,
            args,
            returnValue,
          }) {
            expect(target).toBe(obj);
            expect(thisArg).toBeInstanceOf(Object);
            expect(prop).toBeInstanceOf(Function);
            expect(args).toStrictEqual([ 1, 2, 3 ]);
            expect(returnValue).toStrictEqual([ 1, 2, 3 ]);
          },
        }
      );

      demo.run(1, 2, 3);
    });

    it('after() can modify return value', () => {
      const demo = objectHooks(
        {
          run() {
            return 1;
          },
        },
        {
          after({ returnValue }) {
            return returnValue + 1;
          },
        }
      );

      expect(demo.run()).toBe(2);
    });

    it('after() can modify async return value', async () => {
      const demo = objectHooks(
        {
          async run() {
            return 1;
          },
          async getAge() {
            const age = await Promise.resolve(1);

            return age;
          },
        },
        {
          async afterRun({ returnValue }) {
            return returnValue + 1;
          },
          async afterGetAge() {
            // Do something here.
          },
        }
      );

      await expect(demo.run()).resolves.toBe(2);
      await expect(demo.getAge()).resolves.toBe(1);
    });

    it('Supports custom before/after callbacks', () => {
      const mockBefore = jest.fn();
      const mockBeforeRun = jest.fn();
      const mockAfter = jest.fn();

      const demo = objectHooks(
        {
          run() {
            return true;
          },
        },
        {
          before() {
            mockBefore();
          },
          beforeRun() {
            mockBeforeRun();
          },
          after() {
            mockAfter();
          },
        }
      );

      demo.run();

      expect(mockBefore).not.toHaveBeenCalled();
      expect(mockBeforeRun).toHaveBeenCalled();
      expect(mockAfter).toHaveBeenCalled();
    });

    it('Calls the function with the correct "this"', () => {
      const mock = jest.fn();

      const foo = {
        name: 'foo',
      };

      const demo = objectHooks(
        {
          name: 'bar',
          getName() {
            return this.name;
          },
        },
        {
          afterGetName() {
            mock();
          },
        }
      );

      expect(demo.getName()).toBe('bar');

      const { getName } = demo;

      expect(getName.call(foo)).toBe('foo');

      expect(mock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caches methods', () => {
    it('Stores the method in the cache', () => {
      let callCount = 0;

      const obj = {
        run() {},
      };

      const monitor = objectHooks(obj, {
        [ EVERY_PROPERTY ](prop, propName, cache) {
          if ( callCount === 0 ) {
            expect(cache.has(propName)).toBeFalsy();
          } else {
            expect(cache.has(propName)).toBeTruthy();
          }
        },
        beforeRun() {
          ++callCount;
        },
      });

      monitor.run();

      monitor.run();
    });

    it('Cache can be injected', () => {
      const obj = {
        run() {},
      };

      const cache = new Map();

      const monitor = objectHooks(
        obj,
        {
          beforeRun() {},
        },
        cache
      );

      expect(cache.has('run')).toBeFalsy();

      monitor.run();

      expect(cache.has('run')).toBeTruthy();

      expect(cache.get('run')).toBe(monitor.run);
    });
  });

  describe('Handles nested objects', () => {
    it('Hooks into nested objects', () => {
      const person = {
        job: {
          getTitle() {
            return 'developer';
          },
        },
      };

      const demo = objectHooks(person, {
        job: {
          beforeGetTitle() {
            return 'Software Developer';
          },
        },
      });

      expect(demo.job.getTitle()).toBe('Software Developer');
    });
  });
});
