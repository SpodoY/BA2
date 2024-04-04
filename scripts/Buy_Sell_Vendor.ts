//@ts-nocheck
import { ethers } from "hardhat";
import { CampusToken, FHCWVendor } from "../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";

async function main() {

    let owner: AddressLike;
    let addr1: AddressLike;
    let addr2: AddressLike;
    let addr3: AddressLike;

    [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const campusToken: CampusToken = await ethers.deployContract("CampusToken");
    
    await campusToken.waitForDeployment();

    console.log(`CampusToken deployed to ${campusToken.target}`);

    const vendorMachine: FHCWVendor = await ethers.deployContract("FHCWVendor", [campusToken.target])

    await vendorMachine.waitForDeployment();

    console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

    await campusToken.grantPrivileges(vendorMachine.target)
    console.log(await campusToken.hasPriv(vendorMachine.target))

    // Equals 50.000 Tokens
    const initialVendorTokens = 500_000

    // Mint tokens for FHCWVendor and add them to the VendorContract address
    await campusToken.mint(vendorMachine.target, initialVendorTokens);

    console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);

    // Buy 2000 Tokens for Addr1
    await vendorMachine.connect(addr1).buyTokens({value: String(2 * 10 ** 18)})

    console.log(`Addr1 now has ${await campusToken.balanceOf(addr1)} Tokens`)

    await vendorMachine.connect(addr1).sellTokens(1000)

    console.log(`Addr1 now has ${await campusToken.balanceOf(addr1)} Tokens`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
