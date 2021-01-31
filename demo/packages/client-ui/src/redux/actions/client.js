export function login(address) {
  return { type: 'LOGIN', address };
}

export function setBalance(balance) {
  return { type: 'BALANCE', balance};
}

export function openWallet() {
  return { type: 'OPEN_WALLET' };
}

export function searchMagnet(uri) {
    return { type: 'SEARCH', uri }
}

