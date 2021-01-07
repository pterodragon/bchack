const etherlime = require('etherlime-lib');

const {
  NitroAdjudicatorArtifact,
  EthAssetHolderArtifact,
  TrivialAppArtifact,
} = require("@statechannels/nitro-protocol").ContractArtifacts;

const {
  GanacheDeployer,
  ETHERLIME_ACCOUNTS,
} = require("@statechannels/devtools");


const deploy = async (network,secret, apiKey) => {
  const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, apiKey);


  const NITRO_ADJUDICATOR_ADDRESS = await deployer.deploy(
    NitroAdjudicatorArtifact
  );

  /*
  const ETH_ASSET_HOLDER_ADDRESS = await deployer.deploy(
    EthAssetHolderArtifact,
    {},
    NITRO_ADJUDICATOR_ADDRESS
  );

  const TRIVIAL_APP_ADDRESS = await deployer.deploy(TrivialAppArtifact);
  */

  return {
    NITRO_ADJUDICATOR_ADDRESS,
    //ETH_ASSET_HOLDER_ADDRESS,
    //TRIVIAL_APP_ADDRESS,
  };
};

module.exports = {
  deploy,
};
