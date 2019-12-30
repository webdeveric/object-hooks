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
      const prop = Reflect.get(target, propName, receiver);

      /**
       * If the EVERY_PROPERTY callback exists, it will be called for every
       * property access regardless of contents of the cache.
       * If prop is a function, it will be bound to the target.
       * The callback should return the prop or a replacement for it.
       * The exactHook callback will have "this" be the target object.
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

      /**
       * Return cached hooked prop if it exists.
       */
      if ( this.cache.has(propName) ) {
        return this.cache.get(propName);
      }

      const hookNames = getHookNames( propName );

      const shouldHook = hookNames.some( name => supportsCallback(hooks, name) );

      const exactHook = toCamelCase( propName );

      /**
       * If propName has a matching exactHook callback, it will be called with prop and cache as the arguments.
       * If prop is a function, it will be bound to the target.
       * The callback should return the prop or a replacement for it.
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

      this.cache.set(propName, newProp);

      return newProp;
    },
  };

  return new Proxy(obj, handler);
}
