const { deploy } = require("./deployment/deploy.js");

async function main() {
  const deployedArtifacts = await deploy('0x78d01603751d0ecd4e8138ba897a687a014c4672a2198e845470ac6c581b8e1d');
  console.log(deployedArtifacts);
}

main();
