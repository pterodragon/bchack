/*
    Auth Reducer
    information about user: name, balance, downloaded, uploaded ...

    "isLogged": not used currently. May use to update user infromation when user log in
*/

const initialState = {
    name: 'User 1',
    balance: 100
};

const videoReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'isLogged':
            return {
                ...state,
                name: '',
                balance: 0
            }
        case 'PAY_ETH':
            return {
                ...state,
                balance: state.balance - 10,
            }
        default:
            return state;
    }
}

export default videoReducer;