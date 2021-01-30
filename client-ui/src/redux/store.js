import { createStore, combineReducers } from "redux";
import { initialState as statechannelsInitState, StateChannelsReducer } from "./reducers/statechannels";

const rootReducer = combineReducers({
  statechannels: StateChannelsReducer
});

const rootInitState = {
  statechannels: statechannelsInitState,
}

const store = createStore(rootReducer, rootInitState);
export default store;

