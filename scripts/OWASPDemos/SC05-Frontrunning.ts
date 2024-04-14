//@ts-nocheck
import { ethers } from "hardhat";
import { CampusToken, FHCWVendor } from "../../typechain-types";
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

    let tx = await campusToken.grantPrivileges(vendorMachine.target)
    await tx.wait();

    console.log(await campusToken.hasPriv(vendorMachine.target) ? `Is priviliged` : `Didn't get priviliges`)

    // Equals 50.000 Tokens
    const initialVendorTokens = 500_000

    // Mint tokens for FHCWVendor and add them to the VendorContract address
    tx = await campusToken.mint(vendorMachine.target, initialVendorTokens);
    await tx.wait();

    console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);

    // Owner transfers 10 ETH to Vendor - Needed so we can extract the funds from the Vendor in our attack
    tx = await owner.sendTransaction({
        to: vendorMachine.target,
        value: ethers.parseEther("10")
    })
    await tx.wait()

    console.log(`Vendor ETH balance: ${BigInt(await provider.getBalance(vendorMachine.target)) / BigInt(10 ** 18)}`)

    tx = await FHCWVendor.connect(addr1).riddleReward("Raccoon", {gasPrice: 50 * 10 ** 9}); // 50 Gwei transaction
    await tx.wait()
    
    tx = await FHCWVendor.connect(addr2).riddleReward("Raccoon", {gasPrice: 150 * 10 ** 9}); // 50 Gwei transaction
    await tx.wait()

    console.log(`Addr1 Balance: ${await provider.getBalance(addr1)}`)
    console.log(`Addr2 Balance: ${await provider.getBalance(addr2)}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
