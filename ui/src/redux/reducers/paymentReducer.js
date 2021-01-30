

const initialState = {
    confirmpaywindow: false,
    paymentwindow: false,
    method: '',
    paystatus: ''
};

const paymentReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SEARCH':
            return {
                ...state,
                confirmpaywindow: true
            };
        case 'PAY_METHOD':
            return {
                ...state,
                //paymentwindow: false,
                method: action.payload
            };
        case 'CLOSE_PAY':
            return {
                ...state,
                confirmpaywindow: false,
                paymentwindow: false
            };
        default:
            return state;
    }
}

export default paymentReducer;