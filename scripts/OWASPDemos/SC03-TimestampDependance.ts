//@ts-nocheck
import { ethers } from "hardhat";
import { CampusToken, FHCWVendor } from "../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";

async function main() {

    const provider = ethers.provider;

    let owner: AddressLike;
    let addr1: AddressLike;
    let addr2: AddressLike;
    let addr3: AddressLike;

    [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();
    console.log(`Addresses:\r\n
        1: ${await addr1.getAddress()}
        2: ${await addr2.getAddress()} 
        3: ${await addr3.getAddress()}
    `);

    const campusToken: CampusToken = await ethers.deployContract("CampusToken");
    
    await campusToken.waitForDeployment();

    console.log(`CampusToken deployed to ${campusToken.target}`);

    const vendorMachine: FHCWVendor = await ethers.deployContract("FHCWVendor", [campusToken.target])

    await vendorMachine.waitForDeployment();

    console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

    const sc03: SC03 = await ethers.deployContract("SC03", [vendorMachine.target])

    await sc03.waitForDeployment();

    console.log(`SC03 deployed to ${sc03.target}`);

    let tx = await campusToken.grantPrivileges(vendorMachine.target)
    await tx.wait();

    console.log(await campusToken.hasPriv(vendorMachine.target) ? `Is priviliged` : `Didn't get priviliges`)

    // Equals 50.000 Tokens
    const initialVendorTokens = 500_000

    // Mint tokens for FHCWVendor and add them to the VendorContract address
    tx = await campusToken.mint(vendorMachine.target, initialVendorTokens);
    await tx.wait();

    console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});