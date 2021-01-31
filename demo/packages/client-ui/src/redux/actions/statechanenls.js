const actions = {
  addChannel: (channelId, channel) => ({
    type: 'add-channel',
    channelId, 
    channel
  }),

  updateStatus: (channelId, channelStatus) => ({
    type: 'update-status',
    channelId,
    channelStatus
  }),

  updateDeposited: (channelId, amountDeposited) => ({
    type: 'update-deposited',
    channelId,
    amountDeposited
  }),

  updateAllocations: (channelId, allocationItems) => ({
    type: 'update-allocations',
    channelId,
    allocationItems
  }),
}

export default actions;
