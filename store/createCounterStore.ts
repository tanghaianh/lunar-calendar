type CounterState = {
  count: number;
};

export type CounterStore = {
  getState: () => CounterState;
  increment: () => CounterState;
  decrement: () => CounterState;
  reset: () => CounterState;
};

export function createCounterStore(initialCount = 0): CounterStore {
  let state: CounterState = { count: initialCount };

  return {
    getState: () => state,
    increment: () => {
      state = { count: state.count + 1 };
      return state;
    },
    decrement: () => {
      state = { count: state.count - 1 };
      return state;
    },
    reset: () => {
      state = { count: initialCount };
      return state;
    },
  };
}
