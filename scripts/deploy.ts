import { ethers } from "hardhat";

async function main() {

  const initialSupply: bigint = BigInt(10^18);

  const campusToken = await ethers.deployContract("CampusToken", [initialSupply])

  await campusToken.waitForDeployment();

  console.log(
    `CampusToken deployed to ${campusToken.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
