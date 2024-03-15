import { ethers } from "hardhat";
import { CampusToken, FHCWVendor } from "../typechain-types";

async function main() {

  const campusToken: CampusToken = await ethers.deployContract("CampusToken")
  
  await campusToken.waitForDeployment();

  console.log(`CampusToken deployed to ${campusToken.target}`);

  const vendorMachine: FHCWVendor = await ethers.deployContract("FHCWVendor", [campusToken.target])

  await vendorMachine.waitForDeployment();

  console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

  // Equals 50.000 Tokens
  const initialVendorTokens = 500_000

  // Mint tokens for FHCWVendor and add them to the VendorContract address
  await campusToken.mint(vendorMachine.target, initialVendorTokens); 

  console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
