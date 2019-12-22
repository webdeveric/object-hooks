# Object Hooks

This function allows you to hook into method calls so you can shortcircuit it, alter the return value, or do something else.

## Usage

```js
import objectHooks from '@webdeveric/object-hooks';

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
  name(prop) {
    console.log('Getting name');

    return prop;
  },
  job: {
    title( prop ) {
      return `Software ${prop}`;
    },
  },
  before() {
    console.log('This is called before all methods.');
  },
  after() {
    console.log('This is called after all methods.');
  },
  beforeGetName() {
    return 'Test Testerson';
  },
  afterGetAge({ returnValue }) {
    return returnValue - 10;
  },
});

hooked.sayHi();

console.log( hooked.getName() );

console.log( hooked.getAge() );

console.log( hooked.name );

console.log( hooked.job.title );
```
