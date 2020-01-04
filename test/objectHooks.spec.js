import {
  objectHooks, PROPERTY, BEFORE_PROPERTY, AFTER_PROPERTY,
} from '../src/objectHooks';

describe('objectHooks()', () => {
  describe('arguments', () => {
    it('obj must be an object', () => {
      expect(() => {
        objectHooks({}, {});
      }).not.toThrow();

      expect(() => {
        objectHooks(Object.create(null), {});
      }).not.toThrow();

      expect(() => {
        objectHooks(null, {});
      }).toThrow();
    });

    it('hooks must be an object', () => {
      expect(() => {
        objectHooks({}, {});
      }).not.toThrow();

      expect(() => {
        objectHooks({}, Object.create(null));
      }).not.toThrow();

      expect(() => {
        objectHooks();
      }).toThrow();

      expect(() => {
        objectHooks({});
      }).toThrow();

      expect(() => {
        objectHooks({}, null);
      }).toThrow();
    });

    it('cache must be a Map', () => {
      const cache = new Map();

      expect(() => {
        objectHooks({}, {}, cache);
      }).not.toThrow();

      expect(() => {
        objectHooks({}, {}, {});
      }).toThrow();
    });
  });

  describe('Handles properties that are not functions', () => {
    it('Returns the property', () => {
      const zero = Symbol('Zero');

      const obj = {
        [ zero ]: 'Zero',
        [ 1 ]: 'One',
        name: 'Eric',
      };

      const demo = objectHooks(obj, {});

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

  describe('hooks', () => {
    it('Returns the prop if no hooks defined', () => {
      const person = {
        name: 'Eric',
      };

      const demo = objectHooks(person, {});

      expect(demo.name).toStrictEqual(person.name);
      expect(demo.name === person.name).toBeTruthy();
    });

    describe('Symbol callbacks', () => {
      describe('PROPERTY', () => {
        it('Is called for every property.', () => {
          const mock = jest.fn();

          const person = {
            name: 'Eric',
            age: 100,
          };

          const demo = objectHooks(person, {
            [ PROPERTY ](/*prop, propName, cache */) {
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
            [ PROPERTY ](prop, propName) {
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

      describe('BEFORE_PROPERTY', () => {
        it('Is called', () => {
          const mock = jest.fn();

          const demo = objectHooks(
            {
              run() {},
            },
            {
              [ BEFORE_PROPERTY ]() {
                mock();
              },
            }
          );

          demo.run();

          expect(mock).toHaveBeenCalled();
        });

        it('Can short circuit', () => {
          const shortCircuit = 'short circuit';

          const demo = objectHooks(
            {
              getName() {
                return 'Eric';
              },
            },
            {
              [ BEFORE_PROPERTY ]() {
                return shortCircuit;
              },
            }
          );

          expect(demo.getName()).toBe(shortCircuit);
        });

        it('arguments', () => {
          const obj = {
            run(...args) {
              return args;
            },
          };

          const demo = objectHooks(
            obj,
            {
              [ BEFORE_PROPERTY ]({
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
      });

      describe('AFTER_PROPERTY', () => {
        it('Is called', () => {
          const mock = jest.fn();

          const demo = objectHooks(
            {
              run() {},
            },
            {
              [ AFTER_PROPERTY ]() {
                mock();
              },
            }
          );

          demo.run();

          expect(mock).toHaveBeenCalled();
        });

        it('Can return a new value', () => {
          const demo = objectHooks(
            {
              getName() {
                return 'Eric';
              },
            },
            {
              [ AFTER_PROPERTY ]({ returnValue }) {
                return returnValue + '!';
              },
            }
          );

          expect(demo.getName()).toBe('Eric!');
        });

        it('arguments', () => {
          const obj = {
            run(...args) {
              return args;
            },
          };

          const demo = objectHooks(
            obj,
            {
              [ AFTER_PROPERTY ]({
                target,
                thisArg,
                prop,
                args,
                returnValue,
              }) {
                expect(target).toBe(obj);
                expect(thisArg).toBeInstanceOf(Object);
                expect(prop).toBe(obj.run);
                expect(args).toStrictEqual([ 1, 2, 3 ]);
                expect(returnValue).toStrictEqual([ 1, 2, 3 ]);
              },
            }
          );

          demo.run(1, 2, 3);
        });
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
          job: {
            title: 'developer',
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
          job(prop) {
            return Object.assign({}, prop, { title: 'software developer' });
          },
        });

        expect(demo.age).toBe(100);
        expect(demo.age).toBe(100);
        expect(ageMock).toHaveBeenCalledTimes(2);

        expect(demo.getName()).toBe('Eric!');
        expect(demo.getName()).toBe('Eric!');
        expect(nameMock).toHaveBeenCalledTimes(2);

        expect(demo.job.title).toBe('software developer');
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

    describe('Before/after propName hooks', () => {
      it('Supports custom before/after callbacks', () => {
        const mockBeforeRun = jest.fn();
        const mockAfterRun = jest.fn();

        const demo = objectHooks(
          {
            run() {
              return true;
            },
          },
          {
            beforeRun() {
              mockBeforeRun();
            },
            afterRun() {
              mockAfterRun();
            },
          }
        );

        expect(demo.run()).toBeTruthy();

        expect(mockBeforeRun).toHaveBeenCalled();
        expect(mockAfterRun).toHaveBeenCalled();
      });

      it('before propName arguments', () => {
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
              callback,
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

      it('after propName arguments', () => {
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

      it('after propName can modify return value', () => {
        const demo = objectHooks(
          {
            run() {
              return 1;
            },
          },
          {
            afterRun({ returnValue }) {
              return returnValue + 1;
            },
          }
        );

        expect(demo.run()).toBe(2);
      });

      it('after propName can modify async return value', async () => {
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

      it('before/after hooks on scalars throw an error', () => {
        const demo = objectHooks(
          {
            age: 100,
          },
          {
            beforeAge() {
            },
          }
        );

        expect(() => {
          demo.age;
        }).toThrow();
      });
    });

    it('Callbacks have correct "this"', () => {
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

    it('Async before hooks return a value', async () => {
      const person = {
        async getLocation() {
          return [ 0, 0 ];
        },
      };

      const demo = objectHooks(person, {
        async beforeGetLocation() {
          return [ 90, 90 ];
        },
      });

      await expect(demo.getLocation()).resolves.toEqual(expect.arrayContaining([ 90, 90 ]));
    });

    it('Async after hooks return a value', async () => {
      const person = {
        async getLocation() {
          return [ 0, 0 ];
        },
      };

      const demo = objectHooks(person, {
        async afterGetLocation() {
          return [ 90, 90 ];
        },
      });

      await expect(demo.getLocation()).resolves.toEqual(expect.arrayContaining([ 90, 90 ]));
    });

    describe('Mixing generic and specific hooks', () => {
      it('Async before hooks without a return a value do not alter the return value', async () => {
        const person = {
          async getLocation() {
            return [ 0, 0 ];
          },
        };

        const demo = objectHooks(person, {
          async [ BEFORE_PROPERTY ]() {
          },
          async beforeGetLocation() {
          },
        });

        await expect(demo.getLocation()).resolves.toEqual(expect.arrayContaining([ 0, 0 ]));
      });

      it('One of the async after hooks returns a value', async () => {
        const person = {
          async getLocation() {
            return [ 0, 0 ];
          },
        };

        const demo = objectHooks(person, {
          async [ AFTER_PROPERTY ]() {
          },
          async afterGetLocation() {
            return [ 90, 90 ];
          },
        });

        await expect(demo.getLocation()).resolves.toEqual(expect.arrayContaining([ 90, 90 ]));
      });

      describe('Specific hooks take precedence over generic hooks', () => {
        it('Sync hooks', () => {
          const person = {
            getName() {
              return 'Eric';
            },
          };

          const demo = objectHooks(person, {
            [ BEFORE_PROPERTY ]() {
              return 'wrong';
            },
            beforeGetName() {
              return 'correct';
            },
          });

          expect(demo.getName()).toBe('correct');
        });

        it('Async hooks', async () => {
          const person = {
            async getLocation() {
              return [ 0, 0 ];
            },
          };

          const demo = objectHooks(person, {
            async [ BEFORE_PROPERTY ]() {
              return 'wrong';
            },
            async beforeGetLocation() {
              return [ 90, 90 ];
            },
          });

          await expect(demo.getLocation()).resolves.toEqual(expect.arrayContaining([ 90, 90 ]));
        });
      });
    });
  });

  describe('Caches methods', () => {
    it('Stores the method in the cache', () => {
      let callCount = 0;

      const obj = {
        run() {},
      };

      const monitor = objectHooks(obj, {
        [ PROPERTY ](prop, propName, cache) {
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
