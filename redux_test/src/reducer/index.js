
import inputReducer from './input';
import {combineReducers} from 'redux';

const allReducers = combineReducers ({
    input: inputReducer
});

export default allReducers;
