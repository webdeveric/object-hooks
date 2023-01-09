import { isObject } from '@webdeveric/utils/type-predicate';
import { toPascalCase } from '@webdeveric/utils';

import {
  AFTER_PROPERTY,
  BEFORE_PROPERTY,
  PROPERTY,
} from './symbols.js';

export function isFunction(arg) {
  return typeof arg === 'function';
}

export function isAsyncFunction(arg) {
  return typeof arg === 'function' && arg.constructor.name === 'AsyncFunction';
}

export const hasOwn = 'hasOwn' in Object && typeof Object.hasOwn === 'function'
  ? (obj, propName) => Object.hasOwn(obj, propName)
  : (obj, propName) => Object.prototype.hasOwnProperty.call(obj, propName);

export function hasOwnCallback(obj, propName) {
  return (
    isObject(obj) &&
    hasOwn(obj, propName) &&
    isFunction(obj[ propName ])
  );
}

export function validCache(cache) {
  return [ 'get', 'set', 'has' ].every(prop => isFunction(cache[ prop ]));
}

export function getFirstValue(...callbacks) {
  for (const cb of callbacks) {
    if (typeof cb !== 'function') {
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
    if (typeof cb !== 'function') {
      continue;
    }

    const value = await cb();

    if (value !== undefined) {
      return value;
    }
  }
}

export function getHook(hooks, hookName) {
  return hasOwnCallback(hooks, hookName) ? hooks[ hookName ] : false;
}

export function getHooks(hooks, propName) {
  const pascalPropName = toPascalCase(propName);

  return {
    genericPropHook: getHook(hooks, PROPERTY),
    genericBeforeHook: getHook(hooks, BEFORE_PROPERTY),
    genericAfterHook: getHook(hooks, AFTER_PROPERTY),
    propHook: getHook(hooks, pascalPropName) || getHook(hooks, propName),
    beforeHook: getHook(hooks, `before${pascalPropName}`),
    afterHook: getHook(hooks, `after${pascalPropName}`),
  };
}
