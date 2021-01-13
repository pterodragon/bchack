const {
  NitroAdjudicatorArtifact,
  EthAssetHolderArtifact,
  TrivialAppArtifact,
} = require('@statechannels/nitro-protocol').ContractArtifacts;

import {InfuraPrivateKeyDeployer} from 'etherlime-lib';

const deploy = async (network, secret, api_key) => {
  const deployer = new InfuraPrivateKeyDeployer(secret, network, api_key) 

  const NITRO_ADJUDICATOR_ADDRESS = await deployer.deploy(NitroAdjudicatorArtifact);

  const ETH_ASSET_HOLDER_ADDRESS = await deployer.deploy(
    EthAssetHolderArtifact,
    {},
    NITRO_ADJUDICATOR_ADDRESS
  );


  return {
    NITRO_ADJUDICATOR_ADDRESS,
    ETH_ASSET_HOLDER_ADDRESS,
  };
};

module.exports = {
  deploy,
};
