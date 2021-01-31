export default (state={}, action) => {
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

