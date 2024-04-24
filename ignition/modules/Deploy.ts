import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { chainlink } from "hardhat";

const subscriptionId = 11145

const TokenModule = buildModule("CampusToken", m => {
    const campusToken = m.contract("CampusToken");
    return { campusToken }
})

const ChainlinkConsumerModel = buildModule("ChainLink", m => {
    
    const VRFv2Consumer = m.contract("VRFv2Consumer", [subscriptionId]);
    return { VRFv2Consumer }
})

const VendorModule = buildModule("FHCWVendor", m => {
    const { campusToken } = m.useModule(TokenModule)
    const { VRFv2Consumer } = m.useModule(ChainlinkConsumerModel)
    const Vendor = m.contract("FHCWVendor", [campusToken, VRFv2Consumer]);

    return { Vendor }
})

export default buildModule("Sepolia_Deployment", (m) => {

    const { campusToken } = m.useModule(TokenModule)
    const { VRFv2Consumer } = m.useModule(ChainlinkConsumerModel)
    const { Vendor } = m.useModule(VendorModule)

    const initialVendorTokens = 500_000
    m.call(campusToken, "mint", [Vendor, initialVendorTokens])

    const roleHash = m.staticCall(campusToken, "PRIV_ROLE")
    m.call(campusToken, "grantRole", [roleHash, Vendor])

    return {campusToken, VRFv2Consumer, Vendor};
});