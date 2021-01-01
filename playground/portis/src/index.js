const portis = new Portis('6366fc7e-aa5d-412b-8d47-fdfb454a6f53', 'ropsten');
const web3 = new Web3(portis.provider);
web3.eth.getAccounts((error, accounts) => {
  console.log(accounts);
});
