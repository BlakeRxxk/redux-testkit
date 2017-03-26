import _ from 'lodash';
import {deepEqual} from './utils';

export default function(reducer, state) {
  const initialState = state || reducer(undefined, {});
  return {
    expect: (action) => {
      const originalState = _.cloneDeep(initialState);
      const newState = reducer(initialState, action);
      const mutated = !deepEqual(initialState, originalState);

      return {
        toReturnState: (expected) => {
          expect(newState).toEqual(expected);
          // expect(mutated).toEqual(false);
          if (mutated) {
            throw new Error('state mutated after running reducer');
          }
        },
        toChangeInState: (expectedChanges) => {
          const expected = _.merge({}, originalState, expectedChanges);
          expect(newState).toEqual(expected);
          // expect(mutated).toEqual(false);
          if (mutated) {
            throw new Error('state mutated after running reducer');
          }
        }
      };
    },
    execute: (action) => {
      const originalState = _.cloneDeep(initialState);
      const newState = reducer(initialState, action);
      const mutated = !deepEqual(initialState, originalState);
      if (mutated) {
        throw new Error('state mutated after running reducer');
      }
      return newState;
    }
  };
}
