//@ts-nocheck
import { ethers } from "hardhat";
import { FHCWVendor, VRFv2Consumer } from "../../typechain-types";

async function main() {

    const vendorAddress = "0x3E59E6153D611C3CEc065BDFB5Ca5cA1A5F83db0"
    const vrfAddress = "0xe68C8E28a5Acaa96DD480B1ec0E1590e40C39532"
    const Vendor: FHCWVendor = await ethers.getContractFactory("FHCWVendor")
    const VRF: VRFv2Consumer = await ethers.getContractFactory("VRFv2Consumer")
    const contract = Vendor.attach(
        vendorAddress
    )
    const VRFContract = VRF.attach(
        vrfAddress
    )

    console.log(await VRFContract.owner())
    // console.log(await contract.callGenerateRandomWords())

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
