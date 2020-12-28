import {
  AFTER_PROPERTY,
  BEFORE_PROPERTY,
  PROPERTY,
} from './symbols';

export function isObject(arg) {
  return arg !== null && typeof arg === 'object';
}

export function isFunction(arg) {
  return typeof arg === 'function';
}

export function isAsyncFunction(arg) {
  return typeof arg === 'function' && arg.constructor.name === 'AsyncFunction';
}

export function hasOwnCallback(obj, propName) {
  return (
    isObject(obj) &&
    Object.prototype.hasOwnProperty.call(obj, propName) &&
    isFunction(obj[ propName ])
  );
}

export function validCache( cache ) {
  return [ 'get', 'set', 'has' ].every( prop => isFunction( cache[ prop ] ) );
}

export function getFirstValue(...callbacks) {
  for (const cb of callbacks) {
    if ( typeof cb !== 'function' ) {
      continue;
    }

    const value = cb();

    if (value !== undefined) {
      return value;
    }
  }
}

export async function getFirstValueAsync(...callbacks) {
  for (const cb of callbacks) {
    if ( typeof cb !== 'function' ) {
      continue;
    }

    const value = await cb();

    if (value !== undefined) {
      return value;
    }
  }
}

export function toPascalCase(text, customWords) {
  let words = String(text).match( /[A-Z][a-z']+|\d+|[a-z']+/g );

  if ( ! words ) {
    return '';
  }

  // Uppercase the first letter of each word and replace apostrophe.
  words = words.map( w =>  w.substr(0, 1).toUpperCase() + w.substr(1).replace('\'', '') );

  if ( isObject( customWords ) ) {
    const replacements = Object.entries(customWords).map(([ key, value ]) => [
      key.toLowerCase(),
      value,
    ]);

    if (replacements.length) {
      // This takes a single word and returns the first matching replacement, if any.
      const replaceCustomWords = word => {
        const lowerWord = word.toLowerCase();

        for (const [ key, value ] of replacements) {
          if (key === lowerWord) {
            return value;
          }
        }

        return word;
      };

      words = words.map(replaceCustomWords);
    }
  }

  return words.join('');
}

export function getHook( hooks, hookName ) {
  return hasOwnCallback( hooks, hookName ) ? hooks[ hookName ] : false;
}

export function getHooks( hooks, propName ) {
  const pascalPropName = toPascalCase( propName );

  return {
    genericPropHook: getHook( hooks, PROPERTY ),
    genericBeforeHook: getHook( hooks, BEFORE_PROPERTY ),
    genericAfterHook: getHook( hooks, AFTER_PROPERTY ),
    propHook: getHook( hooks, pascalPropName ) || getHook( hooks, propName ),
    beforeHook: getHook( hooks, `before${pascalPropName}` ),
    afterHook: getHook( hooks, `after${pascalPropName}` ),
  };
}
