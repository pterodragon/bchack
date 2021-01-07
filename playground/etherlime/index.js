const fs = require('fs');
const { deploy } = require('./deployment/deploy.js');


const secret = fs.readFileSync(".secret").toString().trim();
const network = 'ropsten'
const apiKey = '7f86e43dc19c4281921cf83742ec93d4'


async function main() {
  const deployed = await deploy(network, secret, apiKey);

  console.log({ 
    NITRO_ADJUDICATOR_ADDRESS,
    //ETH_ASSET_HOLDER_ADDRESS,
    //TRIVIAL_APP_ADDRESS,
  } = deployed);
}

main();
