import {
  callBefore,
  callAfter,
  isObject,
  isFunction,
  isAsyncFunction,
  supportsCallback,
  toPascalCase,
  lcfirst,
} from './helpers';

function objectHooks(obj, options = {})
{
  if ( ! isObject( obj ) ) {
    throw new Error('objectHooks obj must be an object');
  }

  if ( ! isObject( options ) ) {
    throw new Error('objectHooks options must be an object');
  }

  const proxyHandler = {
    get(target, propName, receiver) {
      const prop = target[ propName ];
      const optionName = lcfirst( toPascalCase( String( propName ) ) );

      /**
       * If propName has a matching optionName callback, it will be called with prop as the only argument.
       * If prop is a function, it will be bound to the target.
       * The callback should return the prop or a replacement for it.
       * The optionName callback will have "this" be the target object.
       */
      if ( supportsCallback(options, optionName) ) {
        return options[ optionName ].call(
          target,
          isFunction(prop) ? prop.bind(target) : prop
        );
      }

      /**
       * Return cached prop if it exists.
       */
      const cache = objectHooks.getCache(target);

      if ( cache.has(propName) ) {
        return cache.get(propName);
      }

      const nestedObject = isObject(prop) && isObject(options[ propName ]);

      if ( ! isFunction(prop) && ! nestedObject ) {
        return Reflect.get(target, propName, receiver);
      }

      const newProp = nestedObject ? objectHooks(prop, options[ propName ]) : isAsyncFunction(prop)
        ? async (...args) => {
          const before = await callBefore(options, propName, {
            target,
            prop,
            args,
          });

          // Allow short circuiting.
          if (before !== undefined) {
            return before;
          }

          const returnValue = await prop.apply(target, args);

          const after = await callAfter(options, propName, {
            target,
            prop,
            args,
            returnValue,
          });

          // Allow modifying the return value
          return after !== undefined ? after : returnValue;
        }
        : (...args) => {
          const before = callBefore(options, propName, {
            target,
            prop,
            args,
          });

          // Allow short circuiting.
          if (before !== undefined) {
            return before;
          }

          const returnValue = prop.apply(target, args);

          const after = callAfter(options, propName, {
            target,
            prop,
            args,
            returnValue,
          });

          // Allow modifying the return value
          return after !== undefined ? after : returnValue;
        };

      Object.defineProperties(
        newProp,
        Object.getOwnPropertyDescriptors(prop)
      );

      cache.set(propName, newProp);

      return newProp;
    },
  };

  return new Proxy(obj, proxyHandler);
}

const cache = Symbol('objectHooksCache');

objectHooks[ cache ] = new WeakMap();

objectHooks.getCache = target => {
  if ( target === undefined ) {
    return objectHooks[ cache ];
  }

  if ( ! objectHooks[ cache ].has( target ) ) {
    objectHooks[ cache ].set( target, new Map() );
  }

  return objectHooks[ cache ].get( target );
};

export default objectHooks;
