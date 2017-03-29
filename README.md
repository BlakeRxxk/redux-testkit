# Redux Testkit
> Complete and opinionated testkit for testing Redux projects (reducers, selectors, actions, thunks)

* [Installation](#installation)
* [Recipe - Unit testing reducers](#recipe---unit-testing-reducers)
* [Recipe - Unit testing selectors](#recipe---unit-testing-selectors)
* [Recipe - Unit testing thunks](#recipe---unit-testing-thunks)
* [Recipe - Integration tests for the entire store](#recipe---integration-tests-for-the-entire-store)
* [Building and testing this library](#building-and-testing-this-library)

<br>

## What tests are we going to write?

* *Unit tests* for [reducers](http://redux.js.org/docs/basics/Reducers.html) - test recipe [here](#recipe---unit-testing-reducers)
* *Unit tests* for [selectors](http://redux.js.org/docs/recipes/ComputingDerivedData.html) - test recipe [here](#recipe---unit-testing-selectors)
* *Unit tests* for [action handlers (thunks)](https://github.com/gaearon/redux-thunk) - test recipe [here](#recipe---unit-testing-thunks)
* *Integration tests* for the entire [store](http://redux.js.org/docs/basics/Store.html) - test recipe [here](#recipe---integration-tests-for-the-entire-store)

<br>

## Installation

* Install the package from npm

```
npm install redux-testkit --save-dev
```

* Make sure you have a test runner installed, we recommend [jest](https://facebook.github.io/jest/docs/getting-started.html)

```
npm install jest --save-dev
```

<br>

## Recipe - Unit testing reducers

```js
import { Reducer } from 'redux-testkit';
import uut from '../reducer';

describe('counter reducer', () => {

  it('should have initial state', () => {
    expect(uut()).toEqual({ counter: 0 });
  });

  it('should handle INCREMENT action on initial state', () => {
    const action = { type: 'INCREMENT' };
    const result = { counter: 1 };
    Reducer(uut).expect(action).toReturnState(result);
  });

  it('should handle INCREMENT action on existing state', () => {
    const action = { type: 'INCREMENT' };
    const state = { counter: 1 };
    const result = { counter: 2 };
    Reducer(uut, state).expect(action).toReturnState(result);
  });

});

```

A redux reducer is a pure function that takes an action object, with a `type` field, and changes the state. In almost every case the state object itself must remain immutable.

#### `Reducer(reducer, state).expect(action).toReturnState(result)`

* Runs the `reducer` on current `state` providing an `action`. The current `state` argument is optional, if not provided uses initial state. Makes sure the returned state is `result`.

* Also verifies immutability - that `state` did not mutate. [Why is this important? see example bug](BUG-EXAMPLES.md#reducer)

> [See some examples of this API](API-EXAMPLES.md#reducerreducer-stateexpectactiontoreturnstateresult)

#### `Reducer(reducer, state).expect(action).toChangeInState(changes)`

* Runs the `reducer` on current `state` providing an `action`. The current `state` argument is optional, if not provided uses initial state. Makes sure the part that changed in the returned state matches `changes` and the rest of the state hasn't changed. The format of `changes` is partial state, even a deep internal object - it is compared to returned state after [merging](https://lodash.com/docs/#merge) the changes with the original state (objects are deep merged, arrays are replaced).

* Also verifies immutability of the `state`.

> *The added value of this API compared to `toReturnState` is when your state object is very large and you prefer to reduce the boilerplate of preparing the entire `result` by yourself.*

> [See some examples of this API](API-EXAMPLES.md#reducerreducer-stateexpectactiontochangeinstatechanges)

#### `Reducer(reducer, state).execute(action)`

* Runs the `reducer` on current `state` providing an `action`. The current `state` argument is optional, if not provided uses initial state.

* Returns the returned state so you can run expectations manually. It's not recommended to use this API directly because you usually won't verify that parts in the returned state that were not supposed to change, indeed did not change.

* Also verifies immutability of the `state`.

> *The added value of this API compared to the others is that it allows you to run your own custom expectations (which isn't recommended).*

> [See some examples of this API](API-EXAMPLES.md#reducerreducer-stateexecuteaction)

<br>

## Recipe - Unit testing selectors

```js
import { Selector } from 'redux-testkit';
import * as uut from '../reducer';

describe('numbers selectors', () => {

  it('should select integers from numbers state', () => {
    const state = { numbers: [1, 2.2, 3.14, 4, 5.75, 6] };
    const result = [1, 4, 6];
    Selector(uut.getIntegers).expect(state).toReturn(result);
  });

});

```

A redux selector is a pure function that takes the state and computes some derivation from it. This operation is read-only and the state object itself must not change.

#### `Selector(selector).expect(state).toReturn(result)`

* Runs the `selector` function on a given `state`. Makes sure the returned result is `result`.

* Also verifies that `state` did not mutate. [Why is this important? see example bug](BUG-EXAMPLES.md#selector)

> [See some examples of this API](API-EXAMPLES.md#selectorselectorexpectstate-argstoreturnresult)

#### `Selector(selector).expect(state, ...args).toReturn(result)`

* Runs the `selector` function on a given `state`. If the selector takes more arguments, provide them at `...args` (the state is always assumed to be the first argument of a selector). Makes sure the returned result is `result`.

* Also verifies that `state` did not mutate.

> [See some examples of this API](API-EXAMPLES.md#selectorselectorexpectstate-argstoreturnresult)

#### `Selector(selector).execute(state, ...args)`

* Runs the `selector` function on a given `state`. If the selector takes more arguments, provide them at `...args` (the state is always assumed to be the first argument of a selector). 

* Returns the returned state so you can run expectations manually.

* Also verifies that `state` did not mutate.

> *The added value of this API compared to the others is that it allows you to run your own custom expectations.*

> [See some examples of this API](API-EXAMPLES.md#selectorselectorexecutestate-args)

<br>

## Recipe - Unit testing thunks

```js
import { Thunk } from 'redux-testkit';
import * as uut from '../actions';

describe('posts actions', () => {

  it('should clear all posts', () => {
    const dispatches = Thunk(uut.clearPosts).execute();
    expect(dispatches.length).toBe(1);
    expect(dispatches[0].getAction()).toEqual({ type: 'POSTS_UPDATED', posts: [] });
  });
  
  it('should fetch posts from server', async () => {
    jest.mock('../../../services/reddit');
    const redditService = require('../../../services/reddit');
    redditService.getPostsBySubreddit.mockReturnValueOnce(['post1', 'post2']);
    
    const dispatches = await Thunk(uut.fetchPosts).execute();
    expect(dispatches.length).toBe(3);
    expect(dispatches[0].getAction()).toEqual({ type: 'POSTS_LOADING', loading: true });
    expect(dispatches[1].getAction()).toEqual({ type: 'POSTS_UPDATED', posts: ['post1', 'post2'] });
    expect(dispatches[2].getAction()).toEqual({ type: 'POSTS_LOADING', loading: false });
  });
  
  it('should filter posts', () => {
    const state = { loading: false, posts: ['funny1', 'scary2', 'funny3'] };
    const dispatches = Thunk(uut.filterPosts, state).execute('funny');
    expect(dispatches.length).toBe(1);
    expect(dispatches[0].getAction()).toEqual({ type: 'POSTS_UPDATED', posts: ['funny1', 'funny3'] });
  });

});

```

A redux thunk wraps a synchronous or asynchronous function that performs an action. It can dispatch other actions (either plain objects or other thunks). It can also perform side effects like accessing servers.

#### `Thunk(action, state).execute(...args)`

* Runs the thunk `action` on current `state` given optional arguments `...args`. The current `state` argument is optional, no need to provide it if the thunk doesn't call `getState()`.

* Returns an array of dispatches performed by the thunk (shallow, these dispatches are not executed). You can run expectations over them manually.

* Also verifies that `state` did not mutate.

> [See some examples of this API](API-EXAMPLES.md#thunkaction-stateexecuteargs)

##### Available expectations over a dispatch

```js
// when a plain object action was dispatched
expect(dispatches[0].isPlainObject()).toBe(true);
expect(dispatches[0].getType()).toEqual('LOADING_CHANGED');
expect(dispatches[0].getAction()).toEqual({ type: 'LOADING_CHANGED', loading: true });

// when another thunk was dispatched
expect(dispatches[0].isFunction()).toBe(true);
expect(dispatches[0].getName()).toEqual('refreshSession'); // the function name, see note below
```

##### Being able to expect dispatched thunk function names

This is relevant when the tested thunk dispatches another thunk. In order to be able to test the name of the thunk that was dispatched, you will have to provide an explicit name to the internal anonymous function in the thunk implementation. For example:

```js
export function refreshSession() {
  return async function refreshSession(dispatch, getState) {
    // ...
  };
}
```

##### Limitations when testing thunks that dispatch other thunks

* If the tested thunk dispatches another thunk, the other thunk is not executed. Different thunks should be considered as different units. Executing another unit should be part of an [integration test](#recipe---integration-tests-for-the-entire-store), not a unit test.

* If the tested thunk dispatches another thunk, you cannot set expectations on the arguments given to the other thunk. Different thunks should be considered as different units. Testing the interfaces between them should be part of an [integration test](#recipe---integration-tests-for-the-entire-store), not a unit test. 

* If the tested thunk dispatches another thunk, you cannot mock the return value of the other thunk. Relying in your implementation on the return value of another thunk is considered bad practice. If you must test that, you should probably be changing your implementation.

> These limitations may seem annoying, but they stem from best practices. If they disrupt your test, it's usually a sign of a code smell in your implementation. Fix the implementation, don't fight to test a bad practice.

<br>

## Recipe - Integration tests for the entire store

```js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { FlushThunks } from 'redux-testkit';

import * as reducers from '../reducers';
import * as postsSelectors from '../posts/reducer';
import * as uut from '../posts/actions';

describe('posts store integration', () => {

  let store, flushThunks, redditService;
  
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    jest.mock('../../services/reddit');
    redditService = require('../../services/reddit');
    // create a store with flushThunks added as the first middleware
    flushThunks = FlushThunks.createMiddleware();
    store = createStore(combineReducers(reducers), applyMiddleware(flushThunks, thunk));
  });
  
  it('should select posts', () => {
    expect(postsSelectors.getSelectedPost(store.getState())).toEqual([]);
    store.dispatch(uut.selectPost('post1'));
    expect(postsSelectors.getSelectedPost(store.getState())).toEqual(['post1']);
    store.dispatch(uut.selectPost('post2'));
    expect(postsSelectors.getSelectedPost(store.getState())).toEqual(['post1', 'post2']);
  });
  
  it('should fetch posts from server', async () => {
    redditService.getPostsBySubreddit.mockReturnValueOnce(['post1', 'post2']);
    expect(postsSelectors.getPostsLoading(store.getState())).toBe(false);
    expect(postsSelectors.getPosts(store.getState())).toEqual([]);
    await store.dispatch(uut.fetchPosts());
    expect(postsSelectors.getPostsLoading(store.getState())).toBe(false);
    expect(postsSelectors.getPosts(store.getState())).toEqual(['post1', 'post2']);
  });

  it('should test a thunk that dispatches another thunk', async () => {
    expect(postsSelectors.isForeground(store.getState())).toBe(false);
    await store.dispatch(uut.initApp()); // this dispathces thunk appOnForeground
    await flushThunks.flush(); // wait until all async thunks resolve
    expect(postsSelectors.isForeground(store.getState())).toBe(true);
  });

});

```

Integration test for the entire store creates a real redux store with an extra flushThunks middleware. Test starts by dispatching an action / thunk. Expectations are set over the final state using selectors.

#### `flushThunks = FlushThunks.createMiddleware()`

* Creates `flushThunks` middleware which should be applied to the store on creation. This middleware is useful for the case where one thunk dispatches another thunk. It allows to wait until all of the thunk promises have been resolved.

* Returns a `flushThunks` instance which has the following methods:

##### `flushThunks.flush()`

* Flushes all asynchronous thunks. Run `await` on this method to wait until all dispatched thunk promises are resolved.

##### `flushThunks.reset()`

* Call this method to reset the list of thunk promises observed by `flushThunks`.

<br>

## Building and testing this library

This section is relevant only if you want to contribute to this library or build it locally.

* Install and build

```
npm install
npm run build
```

* Run lint and tests

```
npm run test
```

<br>

### What's Included?
* [Actions Unit Tests using ActionTest](#usage---actions)
* [Reducers Unit Tests using ReducerTest](#usage---reducers)
* [Integration Tests using WaitForAsyncsMiddleware](#usage---waitforasyncsmiddleware)

### Usage - Actions

To make usage of the module in your test file, import and instantiate it:

```js
import {ActionTest} from 'redux-testkit';

const actionTest = new ActionTest();
```

ActionTest provides these methods:

#### reset()

Simply resets the store, usually you would use this in `beforeEach` or equivalent in your test suite, for example

```js
beforeEach(() => {
    actionTest.reset();
});
```

#### setState(newState)

This sets the redux store state that will be provided via `getState` to thunks dispatched to the mockStore. Use this to set up a test that depends on an existing state.

**Important note: This object is NOT affected by dispatches, or internal dispatches called in tests. This shouldn't cause any problems because thinks _should not rely on the reducer logic_ but should only 'fire and forget' events to the store**

#### dispatchSync(action)

This is the key method for running your tests. Say your thunk is:

```js
export function actionToTest(parameters) {
  return async function(dispatch, getState) {
    //Asynchronous logic with lots of awaits here
  }
}
```
then you send this to the mockStore with `actionTest.dispatchSync(actionToTest(paramObjects));`.

The testkit will run this test **synchronously** and then you can run `expect` asertations on the output with:

#### getDispatched()

This is where you do the work in the tests. To unit test an action, you want to test what effect the action has given a specific starting environment. We set up this environment before the test with `setState()` and by passing parameters. There are three ways a dispatched action can cause effects:

1. By dispatching an object with a `type` field to the store
2. By dispatching another action to the store
3. By calling some external function

In case 3, you test the effect by mocking the external function. Typically you would extract that logic to a separate class and import it into your action's class, and so you mock it by using a tool like `proxyquire` when importing you actions into the test suite.

redux-testkit allows you to *unit test* cases 1 and 2.

`getDispatched()` returns an `array` of all the dispatches sent by the tested action, in order. In case 1, the entire object is saved and you can `expect` it to have a type and other fields, for example:

`getDispatched(n)` returns an object with data about the dispatched at position `n`.

```js
expect(actionTest.getDispatched(0).isPlainObject()). toBeTrue();
expect(actionTest.getDispatched(0).getType()).toEqual(actionTypes.ACTION_TYPE_1);
expect(actionTest.getDispatched(0).getParams().otherField).toEqual({some object});
// Note: getParam() can be used instead of getParams() as a convenience:
expect(actionTest.getDispatched(0).getParam('otherField')).toEqual({some object});
```

In case 2, the `name` of the dispatched function is saved, and can be tested like this

```js
expect(actionTest.getDispatched(1).isFunction()).toBeTrue();
expect(actionTest.getDispatched(1).getName()).toEqual('name_of_function');
```

**If this is another thunk, then you must name the internal anonymous async function, like this:**

```js
export function name_of_function() {
  return async function name_of_function(dispatch, getState) {
  }
}
```

To test a **synchronous** action that dispacthes other actions or objects, you should inject the `mockDispatch()` and `getState()` from the actionTest. For example:

```js
const result = actions.syncAction(actionTest.mockDispatch, actionTest.getState(), params...);
expect(result).toEqual(123456);
expect(actionTest.getDispatched()).to....
```

### Usage - Reducers

`import {ReducerTest} from 'redux-testkit';`

A redux reducer is a function that takes an action object, with a `type` field, and changes the state. In almost every case the state object itslef must be immutable.

You can enforce immutability by using immutability libraries, but those often have a performance impact.

`ReducerTest` offers a test absed new way of enforcing immutability, and syntactic sugar for testing redcuers.

`ReducerTest` takes two arguments in the constructor: the first is the reduce function you want to test, and the second is an option initialState to use for each test.

`ReducerTest` has two methods:

#### test(name, params, testEqual)

This uses your `testEqual` to test a number of cases provided in the `params`.

`params` must be an arra of objects with this structure:

`{action, expected, state, description}` where state and description are optional.

`ReducerTest` will test each case given in the params, with either the default initial state or the provided state, and asseert that the expected result is equal to the actual result.

To test for immutability, use:

#### throwOnMutation()

This will set the `ReducerTest` to throw an exception when the state is mutated in any test then run on it. By testing with `ReducerTest` with this set, you can insure that your state is immutable without the need for any immutability library.

### Usage - WaitForAsyncsMiddleware
a Helpful middleware for running integration tests that include thunk actions.
If you want to test a complex flow in your app from end to end that has nested thunk actions calls, async calls and more, use it.

To import the module in your test file, use
`import {WaitForAsyncsMiddleware} from 'redux-testkit';`

WaitForAsyncsMiddleware provides these methods:

#### createMiddleware()

Creates a redux middleware that captures all async actions and allows you to wait till they are all resolved.

```js
beforeEach(() => {
    const WaitForMiddleware = WaitForAsyncsMiddleware.createMiddleware();
    store = createStore(combineReducers(reducers), applyMiddleware(WaitForMiddleware, thunk));
});
```

#### waitForPendingAsyncs()

This method will wait for all current pending action promises (async calls).
It will also wait for the subsequence async actions that were called as a result of the resolve of any prior async action.
It will finish once all recursive async action calls were resolved.

```js
it('test async action flow', async () => {
    store.dispatch(thunkActionThatCallOtherThunkActions());
    await WaitForAsyncsMiddleware.waitForPendingAsyncs();
    expect(store.getState().expectedData).toBeDefined();
});
```

#### reset()

This method will reset the array of pending async action calls were captured.
reset is being called every time you call `createMiddleware` method.

```js
beforeEach(() => {
    WaitForAsyncsMiddleware.reset();
 });
```


## TODO
[ ] Improve syntax with Matchers - Please open issues to suggest the syntax you'd want!
