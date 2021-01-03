//see https://docs.portis.io/#/quick-start
const portis = new Portis('6366fc7e-aa5d-412b-8d47-fdfb454a6f53', 'ropsten');
const web3 = new Web3(portis.provider);

//see https://docs.portis.io/#/methods
portis.showPortis();

web3.eth.getAccounts((error, accounts) => {
  console.log(accounts);
});

portis.onLogin((walletAddress, email, reputation) => {
  console.log({walletAddress, email, reputation});
});
