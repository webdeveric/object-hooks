import {
  callBefore,
  callAfter,
  isObject,
  isFunction,
  isAsyncFunction,
  supportsCallback,
  toCamelCase,
  getHookNames,
} from './helpers';

export const EVERY_PROPERTY = Symbol('EVERY_PROPERTY');

export function objectHooks(obj, hooks = {}, cache = new Map())
{
  if ( ! isObject( obj ) ) {
    throw new Error('objectHooks obj must be an object');
  }

  if ( ! isObject( hooks ) ) {
    throw new Error('objectHooks hooks must be an object');
  }

  const handler = {
    cache,
    // Trap for getting a property value.
    get(target, propName, receiver) {
      // Return cached hooked prop if it exists.
      if ( this.cache.has(propName) ) {
        return this.cache.get(propName);
      }

      const prop = Reflect.get(target, propName, receiver);

      /**
       * If the EVERY_PROPERTY callback exists, it will be called for every uncached property access.
       * The callback can return the prop or a replacement for it.
       * If nothing is returned, it'll continue with looking for other hooks to call.
       * The EVERY_PROPERTY callback will have "this" be the target object.
       */
      if ( supportsCallback(hooks, EVERY_PROPERTY) ) {
        const value = hooks[ EVERY_PROPERTY ].call(
          target,
          prop,
          propName,
          this.cache
        );

        if (value !== undefined) {
          return value;
        }
      }

      const shouldHook = getHookNames( propName ).some( name => supportsCallback(hooks, name) );

      const exactHook = toCamelCase( propName );

      /**
       * If propName has a matching exactHook callback, it will be called with prop and cache as the arguments.
       * The callback can return the prop or a replacement for it.
       * The exactHook callback will have "this" be the target object.
       */
      if ( supportsCallback(hooks, exactHook) ) {
        const value = hooks[ exactHook ].call(
          target,
          prop,
          this.cache
        );

        if (value !== undefined) {
          return value;
        }
      }

      const nestedObject = isObject(prop) && isObject(hooks[ propName ]);

      if ( ! shouldHook && ! nestedObject ) {
        return prop;
      }

      let newProp;

      if ( nestedObject ) {
        newProp = objectHooks(prop, hooks[ propName ]);
      }

      if ( isFunction(prop) ) {
        const functionHandler = isAsyncFunction(prop) ? {
          async apply(func, thisArg, args) {
            const before = await callBefore(hooks, propName, {
              target,
              thisArg,
              prop,
              func,
              args,
              callback: func.bind(thisArg, ...args),
            });

            // Allow short circuiting.
            if (before !== undefined) {
              return before;
            }

            const returnValue = await func.apply(thisArg, args);

            const after = await callAfter(hooks, propName, {
              target,
              thisArg,
              prop,
              args,
              returnValue,
            });

            // Allow modifying the return value
            return after !== undefined ? after : returnValue;
          },
        } : {
          apply(func, thisArg, args) {
            const before = callBefore(hooks, propName, {
              target,
              thisArg,
              prop,
              func,
              args,
              callback: func.bind(thisArg, ...args),
            });

            // Allow short circuiting.
            if (before !== undefined) {
              return before;
            }

            const returnValue = func.apply(thisArg, args);

            const after = callAfter(hooks, propName, {
              target,
              thisArg,
              prop,
              args,
              returnValue,
            });

            // Allow modifying the return value
            return after !== undefined ? after : returnValue;
          },
        };

        newProp = new Proxy(prop, functionHandler);
      }

      return newProp ? this.cache.set(propName, newProp).get(propName) : prop;
    },
  };

  return new Proxy(obj, handler);
}
