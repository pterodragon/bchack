import { createStore } from "redux";
import {initialState, StateChannelsReducer as rootReducer } from "./reducers/statechannels";


const store = createStore(
  rootReducer,
  initialState
);

export default store;
