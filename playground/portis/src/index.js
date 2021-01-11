//see https://docs.portis.io/#/quick-start
const network = 'ropsten':
const portis = new Portis('6366fc7e-aa5d-412b-8d47-fdfb454a6f53', network);
const web3 = new Web3(portis.provider);

const matric = new Matic({
  network,
  maticProvider: 'network.Matic.RPC',
  parentprovider: portis.provider
});
matric.initialize();

//see https://docs.portis.io/#/methods
portis.showPortis();

web3.eth.getAccounts((error, accounts) => {
  console.log('accounts', accounts);
});

portis.onLogin((walletAddress, email, reputation) => {

});
