export const initialState = {
  /*
    "abc123": {
      channelStatus: "active",
      amountDeposited: 100000,
      allocationItems: [{destination:'0x0101010989ae214', amount: "50000"}, {destination:'0x781278541a7c8b', amount: "50000"}],
    },
    */
};

export const StateChannelsReducer = (state=initialState, action) => {
  const {channelId} = action;

  switch(action.type) {
    case 'add-channel':
      return {
        ...state,
        [channelId]: action.channel
      };
    case 'update-status':
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          channelStatus: action.channelStatus
        }
      };
    case 'update-deposited':
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          amountDeposited: action.amountDeposited
        }
      };
    case 'update-allocations':
      return {
        ...state,
        [channelId]: {
          ...state[channelId],
          allocationItems: action.allocationItems
        }
      };
  }

  return state;
}

