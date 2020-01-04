# Object Hooks

[![Build Status](https://travis-ci.org/webdeveric/object-hooks.svg?branch=master)](https://travis-ci.org/webdeveric/object-hooks)

This function allows you to hook into an object so you can alter property values or do something before/after a method call.

## Usage

```js
import { objectHooks, PROPERTY, BEFORE_PROPERTY, AFTER_PROPERTY } from '@webdeveric/object-hooks';

const person = {
  name: 'Eric',
  age: 100,
  job: {
    title: 'developer',
  },
  sayHi() {
    console.log(`Hi! My name is ${this.name}.`);
  },
  getName() {
    return this.name;
  },
  getAge() {
    return this.age;
  },
};

const hooked = objectHooks(person, {
  // This is a specific hook for the name property
  name( prop ) {
    console.log('Getting name');

    return prop;
  },
  beforeGetName() {
    return 'Test Testerson';
  },
  afterGetAge({ returnValue }) {
    return returnValue - 10;
  },
  // You can hook into nested objects.
  job: {
    title( prop ) {
      return `Software ${prop}`;
    },
  },
  // The following Symbol based hooks are generic and will not be used if a specific hook is defined, such as the name() hook above.
  // This is a generic hook for all properties
  [ PROPERTY ](/* prop, propName, cache */) {
    // This is called for every property access, unless there is a specific hook defined.
  },
  // If the property is a function, this will be called before.
  [ BEFORE_PROPERTY ](/* { target, thisArg, prop, func, args, callback } */) {
    // You can return new value here
  },
  // If the property is a function, this will be called after.
  [ AFTER_PROPERTY ](/* { target, thisArg, prop, args, returnValue } */) {
    // You can modify the return value here
  },
});

hooked.sayHi();

console.log( hooked.getName() );

console.log( hooked.getAge() );

console.log( hooked.name );

console.log( hooked.job.title );
```
