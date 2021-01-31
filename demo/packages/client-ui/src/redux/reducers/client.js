const initialState = {
  logined: false,
  address: ''
};

export default function(state=initialState, action) {
  switch (action.type) {
    case 'LOGIN':
      return {...state, logined: true, address: action.address};
    case 'BALANCE':
      const balance = parseInt(action.balance) + 'wei';
      return {...state, balance};
    case 'OPEN_WALLET':
      client.wallet.open();
      return state;
    case 'SEARCH':
      //FIXME: shouldn't use global
      global.client.leecher.add(action.uri);
      return {...state, uri: action.uri};
  }
  return state;
}

