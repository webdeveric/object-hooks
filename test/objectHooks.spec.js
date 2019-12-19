import objectHooks from '../src/objectHooks';

describe("objectHooks()", () => {
  describe("Handles properties that are not functions", () => {
    it("Returns the property", () => {
      const demo = objectHooks({ name: 'Eric' });

      expect(demo.name).toBe('Eric');
    });
  });

  describe("options", () => {
    it("before()", () => {
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

      expect(mock).toBeCalled();
    });

    it("before() short circuit", () => {
      const shortCircuit = "short circuit";

      const demo = objectHooks(
        {
          run() {},
          async getName() {
            const name = await Promise.resolve('Eric');

            return name;
          }
        },
        {
          before() {
            return shortCircuit;
          },
        }
      );

      const results = demo.run();

      expect(results).toBe(shortCircuit);
      expect(demo.getName()).resolves.toBe(shortCircuit);
    });

    it("after()", () => {
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

      expect(mock).toBeCalled();
    });

    it("after() can modify return value", () => {
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

    it("after() can modify async return value", () => {
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

      expect(demo.run()).resolves.toBe(2);
      expect(demo.getAge()).resolves.toBe(1);
    });

    it("Supports custom before/after callbacks", () => {
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

      expect(mockBefore).not.toBeCalled();
      expect(mockBeforeRun).toBeCalled();
      expect(mockAfter).toBeCalled();
    });
  });

  describe("Caches methods", () => {
    it("Stores the method in the cache", () => {
      const obj = {
        run() {
          return true;
        },
      };

      const monitor = objectHooks(obj);

      expect(objectHooks.cache.has(obj)).toBeFalsy();

      monitor.run();

      expect(objectHooks.cache.has(obj)).toBeTruthy();

      expect(objectHooks.cache.get(obj).get("run")).toBeInstanceOf(Function);

      expect(objectHooks.cache.get(obj).get("run")).toEqual(monitor.run);
    });
  });
});
