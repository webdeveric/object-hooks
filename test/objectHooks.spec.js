import objectHooks from '../src/objectHooks';

describe('objectHooks()', () => {
  describe('Handles properties that are not functions', () => {
    it('Returns the property', () => {
      const demo = objectHooks({ name: 'Eric' });

      expect(demo.name).toBe('Eric');
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
          symbolSymbolToPrimitive: prop => (...args) => {
            const value = prop(...args);

            return `WebDev${value}`;
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

    it('options must be an object', () => {
      expect(() => {
        objectHooks({}, {});
        objectHooks({}, undefined);
      }).not.toThrow();

      expect(() => {
        objectHooks({}, null);
      }).toThrow();
    });
  });

  describe('options', () => {
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
  });

  describe('Caches methods', () => {
    it('Stores the method in the cache', () => {
      let obj = {
        run() {
          return true;
        },
      };

      const monitor = objectHooks(obj);

      const cache = objectHooks.getCache();

      expect(cache.has(obj)).toBeFalsy();

      monitor.run();

      expect(cache.has(obj)).toBeTruthy();

      expect(cache.get(obj).get('run')).toBeInstanceOf(Function);

      expect(cache.get(obj).get('run')).toEqual(monitor.run);

      obj = null;

      expect(cache.has(obj)).toBeFalsy();
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
