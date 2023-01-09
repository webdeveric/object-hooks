import { isObject } from '@webdeveric/utils/type-predicate';

import {
  getFirstValue,
  getFirstValueAsync,
  getHooks,
  isAsyncFunction,
  isFunction,
  validCache,
} from './helpers.js';

export * from './symbols.js';

export function objectHooks(obj, hooks, cache = new Map())
{
  if ( ! isObject( obj ) ) {
    throw new Error('objectHooks obj must be an object');
  }

  if ( ! isObject( hooks ) ) {
    throw new Error('objectHooks hooks must be an object');
  }

  if ( ! validCache( cache ) ) {
    throw new Error('objectHooks cache must be an object');
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

      const {
        genericPropHook,
        genericBeforeHook,
        genericAfterHook,
        propHook,
        beforeHook,
        afterHook,
      } = getHooks( hooks, propName );

      if ( genericPropHook || propHook ) {
        const preemptValue = getFirstValue(
          propHook && propHook.bind(target, prop, this.cache),
          genericPropHook && genericPropHook.bind(target, prop, propName, this.cache),
        );

        if (preemptValue !== undefined) {
          return preemptValue;
        }
      }

      const shouldHook = isFunction(prop) && !! ( genericBeforeHook || genericAfterHook || beforeHook || afterHook );
      const nestedObject = isObject(prop) && isObject(hooks[ propName ]);

      // Thrown an error if the user is trying to use a hook on a prop that is not a function.
      if ( ! isFunction(prop) && !! ( beforeHook || afterHook ) ) {
        throw new Error(`${propName} is not a function that can have before/after hooks. Please use "${propName}()" if you want to modify this property.`);
      }

      let newProp;

      if ( nestedObject ) {
        newProp = objectHooks(prop, hooks[ propName ]);
      }

      if ( shouldHook ) {
        const functionHandler = isAsyncFunction(prop) ? {
          async apply(func, thisArg, args) {
            if ( genericBeforeHook || beforeHook ) {
              const hookOptions = {
                target,
                thisArg,
                prop,
                func,
                args,
                callback: func.bind(thisArg, ...args),
              };

              const value = await getFirstValueAsync(
                beforeHook && beforeHook.bind(target, hookOptions),
                genericBeforeHook && genericBeforeHook.bind(target, hookOptions),
              );

              // Allow short circuiting.
              if (value !== undefined) {
                return value;
              }
            }

            const returnValue = await func.apply(thisArg, args);

            if ( genericAfterHook || afterHook ) {
              const hookOptions = {
                target,
                thisArg,
                prop,
                args,
                returnValue,
              };

              const value = await getFirstValueAsync(
                afterHook && afterHook.bind(target, hookOptions),
                genericAfterHook && genericAfterHook.bind(target, hookOptions),
              );

              if (value !== undefined) {
                return value;
              }
            }

            return returnValue;
          },
        } : {
          apply(func, thisArg, args) {
            if ( genericBeforeHook || beforeHook ) {
              const hookOptions = {
                target,
                thisArg,
                prop,
                func,
                args,
                callback: func.bind(thisArg, ...args),
              };

              const value = getFirstValue(
                beforeHook && beforeHook.bind(target, hookOptions),
                genericBeforeHook && genericBeforeHook.bind(target, hookOptions),
              );

              // Allow short circuiting.
              if (value !== undefined) {
                return value;
              }
            }

            const returnValue = func.apply(thisArg, args);

            if ( genericAfterHook || afterHook ) {
              const hookOptions = {
                target,
                thisArg,
                prop,
                args,
                returnValue,
              };

              const value = getFirstValue(
                afterHook && afterHook.bind(target, hookOptions),
                genericAfterHook && genericAfterHook.bind(target, hookOptions),
              );

              if (value !== undefined) {
                return value;
              }
            }

            return returnValue;
          },
        };

        newProp = new Proxy(prop, functionHandler);
      }

      return newProp ? this.cache.set(propName, newProp).get(propName) : prop;
    },
  };

  return new Proxy(obj, handler);
}
