import { chainlink, ethers } from "hardhat";
import { CampusToken, FHCWVendor, VRFv2Consumer } from "../typechain-types";

async function main() {

  const sanityCheck = await ethers.deployContract("CampusToken")
  await sanityCheck.waitForDeployment();
  console.log(`SanityCheck deployed to ${await sanityCheck.target}`);

  // Deploy ERC20 Token
  const campusTokenFactory = await ethers.getContractFactory("CampusToken")
  const campusToken: CampusToken = await campusTokenFactory.deploy()
  await campusToken.waitForDeployment()
  console.log(`CampusToken deployed to ${await campusToken.target}`);

  // Deploy ChainlinkConsumer
  const subscriptionId = 11145
  const VRFv2ConsumerFactory = await ethers.getContractFactory("VRFv2Consumer");
  const VRFv2Consumer: VRFv2Consumer = await VRFv2ConsumerFactory.deploy(subscriptionId);
  await VRFv2Consumer.waitForDeployment()
  console.log(`VRFv2Consumer deployed to: ${VRFv2Consumer.target}`);

  // Add VRF Consumer to VRF Subscription
  //@ts-ignore
  await chainlink.addVrfConsumer(
    0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625,
    VRFv2Consumer.target,
    subscriptionId
  )

  // Deploy Vending Machine
  const vendorMachineFactory = await ethers.getContractFactory("FHCWVendor") 
  const vendorMachine: FHCWVendor = await vendorMachineFactory.deploy(campusToken.target, VRFv2Consumer.target);
  console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

  // Equals 50.000 Tokens
  const initialVendorTokens = 500_000

  // Mint tokens for FHCWVendor and add them to the VendorContract address
  await campusToken.mint(vendorMachine.target, initialVendorTokens); 

  const roleHash = await campusToken.PRIV_ROLE();
  await campusToken.grantRole(roleHash, vendorMachine.target)

  console.log(`Is priv: ${campusToken.hasRole(roleHash, vendorMachine.target)}`)
  console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);

  await vendorMachine.callGenerateRandomWords()
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
