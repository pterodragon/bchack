const { deploy } = require("./deployment/deploy.js");
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  const deployedArtifacts = await deploy(process.env.WALLET_PRIVATE_KEY);
  console.log(deployedArtifacts);
}

main();
