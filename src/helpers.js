export function capitalize(word) {
  const w = `${word}`;

  return `${w.substr(0, 1).toUpperCase()}${w.substr(1)}`;
}

export function toPascalCase(text, customWords) {
  let pascal = text
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/(?=[A-Z])|(\d+)|\s+/)
    .filter(Boolean)
    .map(capitalize);

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

      pascal = pascal.map(replaceCustomWords);
    }
  }

  return pascal.join('');
}

export function isFunction(func) {
  return typeof func === 'function';
}

export function isAsyncFunction(func) {
  return typeof func === 'function' && func.constructor.name === 'AsyncFunction';
}

export function supportsCallback(obj, name) {
  return obj && name in obj && isFunction(obj[name]);
}

export function callCustom(obj, prefix, prop, ...args) {
  const customCallback = `${prefix}${toPascalCase(prop)}`;

  if (supportsCallback(obj, customCallback)) {
    return obj[customCallback](...args);
  }

  if (supportsCallback(obj, prefix)) {
    return obj[prefix](...args);
  }
}

export function callBefore(obj, prop, ...args) {
  return callCustom(obj, 'before', prop, ...args);
}

export function callAfter(obj, prop, ...args) {
  return callCustom(obj, 'after', prop, ...args);
}
