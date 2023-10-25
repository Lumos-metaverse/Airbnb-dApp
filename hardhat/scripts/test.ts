import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000) + 100;
  const unlockTime = currentTimestampInSeconds + 2000;

  console.log("Currenct time", currentTimestampInSeconds);
  console.log("Next time", unlockTime);

  console.log("Difference", unlockTime - currentTimestampInSeconds)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
