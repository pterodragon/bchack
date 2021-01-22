import { createStore } from 'redux';

import allReducers from "./reducer";
import inputReducer from './reducer/input';


const store = createStore(
    allReducers,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;
