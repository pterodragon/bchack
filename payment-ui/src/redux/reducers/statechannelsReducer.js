const initialState = {
  statechannels: {
    "abc123": {
      channelStatus: "active",
      amountDeposited: 100000,
      allocationItems: [{destination:'0x0101010989ae214', amount: "50000"}, {destination:'0x781278541a7c8b', amount: "50000"}],
    },
    "b9478e": {
      channelStatus: "completed",
      amountDeposited: 300000,
      allocationItems: [{destination:'0x0243010b89ac289', amount: '130000'}, {destination:'0xd8e278f4187111}', amount: '170000'}],
    } }
};

export default function(state=initialState, action) {
  //return state;
  return initialState;
}
