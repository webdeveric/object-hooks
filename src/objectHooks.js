import {
  callBefore,
  callAfter,
  isObject,
  isFunction,
  isAsyncFunction,
  supportsCallback,
  toPascalCase,
  lcfirst,
  getHookNames,
} from './helpers';

export const EVERY_PROPERTY = Symbol('EVERY_PROPERTY');

export function objectHooks(obj, options = {}, cache = new Map())
{
  if ( ! isObject( obj ) ) {
    throw new Error('objectHooks obj must be an object');
  }

  if ( ! isObject( options ) ) {
    throw new Error('objectHooks options must be an object');
  }

  const handler = {
    cache,
    get(target, propName /*, receiver */) {
      // const descriptor = Reflect.getOwnPropertyDescriptor(target, propName);

      // console.log(descriptor);

      let prop = Reflect.get(target, propName /*, receiver */);

      // if ( isFunction(prop) ) {
      //   prop = prop.bind(target);
      // }

      /**
       * If the EVERY_PROPERTY callback exists, it will be called for every
       * property access regardless of contents of the cache.
       * If prop is a function, it will be bound to the target.
       * The callback should return the prop or a replacement for it.
       * The exactHook callback will have "this" be the target object.
       */
      if ( supportsCallback(options, EVERY_PROPERTY) ) {
        const value = options[ EVERY_PROPERTY ].call(
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

      const shouldHook = hookNames.some( name => supportsCallback(options, name) );

      const exactHook = lcfirst( toPascalCase( propName ) );

      /**
       * If propName has a matching exactHook callback, it will be called with prop and cache as the arguments.
       * If prop is a function, it will be bound to the target.
       * The callback should return the prop or a replacement for it.
       * The exactHook callback will have "this" be the target object.
       */
      if ( supportsCallback(options, exactHook) ) {
        const value = options[ exactHook ].call(
          target,
          prop,
          this.cache
        );

        if (value !== undefined) {
          return value;
        }
      }

      const nestedObject = isObject(prop) && isObject(options[ propName ]);

      if ( ! shouldHook && ! nestedObject ) {
        return prop;
      }

      let newProp;

      if ( nestedObject ) {
        newProp = objectHooks(prop, options[ propName ]);
      }

      if ( isFunction(prop) ) {
        const functionHandler = isAsyncFunction(prop) ? {
          async apply(func, thisArg, args) {
            const before = await callBefore(options, propName, {
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

            const returnValue = await func(...args);

            const after = await callAfter(options, propName, {
              target,
              prop,
              args,
              returnValue,
            });

            // Allow modifying the return value
            return after !== undefined ? after : returnValue;
          },
        } : {
          apply(func, thisArg, args) {
            const before = callBefore(options, propName, {
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

            const returnValue = func(...args);

            const after = callAfter(options, propName, {
              target,
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
