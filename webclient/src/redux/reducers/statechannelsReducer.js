const initialState = {
  statechannels: {
    "abc123": {
      deposited: 100000,
      remain: 13875,
      participants: ['0x0101010989ae214', '0x781278541a7c8b'],
    },
    "b9478e": {
      deposited: 300000,
      remain: 201032,
      participants: ['0x0243010b89ac289', '0xd8e278f4187111'],
    } }
};

export default function(state=initialState, action) {
  //return state;
  return initialState;
}
