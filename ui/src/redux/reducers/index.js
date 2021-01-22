/*
    Combine Reducers
    combine all reducers, transform from state to next state
*/

import videoReducer from './videoReducer';
import authReducer from './authReducer';
import {combineReducers} from 'redux';

export default combineReducers ({
    video: videoReducer,
    auth: authReducer
});