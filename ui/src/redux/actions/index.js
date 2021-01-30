/*
    Action
    
    "SEARCH": update state of magnet_link when user clicked search button
*/

export const magnet_search = value => {
    return {
        type: 'SEARCH',
        payload: value
    }
}

export const pay_method = value => {
    return {
        type: 'PAY_METHOD',
        payload: value
    }
}

export const pay_eth = value => {
    return {
        type: 'PAY_ETH'
    }
}

export const close_pay = () => {
    return {
        type: 'CLOSE_PAY'
    }
}