import {
  callBefore, callAfter, isFunction, isAsyncFunction,
} from './helpers';

function objectHooks(obj, options = {}) {
  const getMethodMap = target => {
    if (!objectHooks.cache.has(target)) {
      objectHooks.cache.set(target, new Map());
    }

    return objectHooks.cache.get(target);
  };

  const proxyHandler = {
    get(target, prop, receiver) {
      if (!isFunction(target[prop])) {
        return Reflect.get(target, prop, receiver);
      }

      const methods = getMethodMap(target);

      if (methods.has(prop)) {
        return methods.get(prop);
      }

      const method = target[prop];

      const newMethod = isAsyncFunction(method)
        ? async (...args) => {
          const before = await callBefore(options, prop, {
            target,
            prop,
            args,
          });

          // Allow short circuiting.
          if (before !== undefined) {
            return before;
          }

          const returnValue = await method.apply(target, args);

          const after = await callAfter(options, prop, {
            target,
            prop,
            args,
            returnValue,
          });

          // Allow modifying the return value
          return after !== undefined ? after : returnValue;
        }
        : (...args) => {
          const before = callBefore(options, prop, {
            target,
            prop,
            args,
          });

          // Allow short circuiting.
          if (before !== undefined) {
            return before;
          }

          const returnValue = method.apply(target, args);

          const after = callAfter(options, prop, {
            target,
            prop,
            args,
            returnValue,
          });

          // Allow modifying the return value
          return after !== undefined ? after : returnValue;
        };

      Object.defineProperties(
        newMethod,
        Object.getOwnPropertyDescriptors(method)
      );

      methods.set(prop, newMethod);

      return newMethod;
    },
  };

  return new Proxy(obj, proxyHandler);
}

objectHooks.cache = new WeakMap();

export default objectHooks;
