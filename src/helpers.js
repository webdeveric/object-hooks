import {
  PROPERTY,
  BEFORE_PROPERTY,
  AFTER_PROPERTY,
} from './symbols';

export function ucfirst(text) {
  const w = String(text);

  return w.substr(0, 1).toUpperCase() + w.substr(1);
}

export function lcfirst(text) {
  const w = String(text);

  return w.substr(0, 1).toLowerCase() + w.substr(1);
}

export function capitalize(text) {
  return ucfirst( String(text).toLowerCase() );
}

export function toPascalCase(text, customWords) {
  let words = String(text).match( /[A-Z][a-z]+|\d+|[a-z]+/g );

  if ( ! words ) {
    return '';
  }

  words = words.map(ucfirst);

  if (customWords && typeof customWords === 'object') {
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

export function isObject(arg) {
  return arg !== null && typeof arg === 'object';
}

export function isFunction(arg) {
  return typeof arg === 'function';
}

export function isAsyncFunction(arg) {
  return typeof arg === 'function' && arg.constructor.name === 'AsyncFunction';
}

export function supportsCallback(obj, propName) {
  return (
    isObject(obj) &&
    Object.prototype.hasOwnProperty.call(obj, propName) &&
    isFunction(obj[ propName ])
  );
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

  return undefined;
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

  return undefined;
}

export function getHook( hooks, hookName ) {
  return supportsCallback( hooks, hookName ) ? hooks[ hookName ] : false;
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
