const initialState = {
    inputValue: ''
};

const inputReducer = (state = initialState, action) => {
    console.log('reducer', action);

    switch(action.type) {
        case 'INPUT_CHANGE':
            return Object.assign({}, state, {inputValue: action.payload});
        default:
            return state;
    }
}

export default inputReducer;