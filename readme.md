# Object Hooks

This function allows you to hook into method calls so you can shortcircuit it, alter the return value, or do something else.

## Usage

```js
import objectHooks from '@webdeveric/object-hooks';

const person = {
  name: 'Eric',
  age: 100,
  sayHi() {
    console.log('Hi!');
  }
  getName() {
    return this.name;
  },
  getAge() {
    return this.age;
  }
};

const hooked = objectHooks(person, {
  before() {
    console.log('This is called before all methods.');
  }
  beforeGetName() {
    return 'Test Testerson';
  },
  afterGetAge({ returnValue }) {
    return returnValue - 10;
  }
});

hooked.sayHi();

console.log( hooked.getName() );

console.log( hooked.getAge() );
```
