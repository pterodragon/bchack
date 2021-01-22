/*
    Action
    
    SEARCH": update state of magnet_link when user clicked search button
*/

export const magnet_search = value => {
    return {
        type: 'SEARCH',
        payload: value
    }
}