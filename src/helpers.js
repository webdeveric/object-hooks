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

export function toCamelCase(text) {
  return lcfirst( toPascalCase(text) );
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

export function callCustom(obj, prefix, prop, ...args) {
  const prefixCallback = toCamelCase(prefix);
  const customCallback = prefixCallback + toPascalCase(prop);

  if (supportsCallback(obj, customCallback)) {
    return obj[ customCallback ](...args);
  }

  if (supportsCallback(obj, prefixCallback)) {
    return obj[ prefixCallback ](...args);
  }
}

export function callBefore(obj, prop, ...args) {
  return callCustom(obj, 'before', prop, ...args);
}

export function callAfter(obj, prop, ...args) {
  return callCustom(obj, 'after', prop, ...args);
}

export function getHookNames(propName) {
  const hook = toPascalCase( propName );

  return [
    lcfirst(hook),
    `before${hook}`,
    `after${hook}`,
    'before',
    'after',
  ];
}
