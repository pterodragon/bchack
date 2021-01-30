/*
    Video Reducer
    for video infromation: magnet link, seeder, address, peer ...

    "SEARCH": update state of magnet_link when user clicked search button
*/

const initialState = {
    magnet_link: '',
    seeder: 'seeder 1',
    address: '8.8.8.8',
    peer: 7,
    statechannelid: 'abc123',
};

const videoReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SEARCH':
            return {
                ...state,
                magnet_link: action.payload
            };//Object.assign({}, state, {magnet_link: action.payload})
        default:
            return state;
    }
}

export default videoReducer;