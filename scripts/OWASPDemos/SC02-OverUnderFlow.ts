import { ethers } from "hardhat";
import { SC02, TimeLock } from "typechain-types/MaliciousContracts/SC02.sol" 
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

    const sc02: SC02 = await ethers.deployContract("SC02")

    await sc02.waitForDeployment();

    console.log(`SC02 deployed to ${sc02.target}`);

    console.log(`Overflow before 'attack' ${await sc02.overflow()}`);

    let tx = await sc02.causeOverflow();
    await tx.wait();

    console.log(`Overflow after 'attack' ${await sc02.overflow()}`);

    console.log(`Underflowbefore 'attack' ${await sc02.underflow()}`);

    tx = await sc02.causeUnderflow();
    await tx.wait();

    console.log(`Overflow after 'attack' ${await sc02.underflow()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});