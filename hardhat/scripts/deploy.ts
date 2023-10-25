import { ethers } from "hardhat";

async function main() {
  const airBnb = await ethers.deployContract("AirBNB");

  await airBnb.waitForDeployment();

  console.log(
    `AirBNB contract  deployed to ${airBnb.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
