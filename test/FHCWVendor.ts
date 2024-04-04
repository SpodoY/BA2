import { expect } from "chai";
import { ethers } from "hardhat";
import { CampusToken, CampusToken__factory, FHCWVendor, FHCWVendor__factory } from "../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";

describe('CampusToken', () => {
    //global vars
    let TokenFactory: CampusToken__factory;
    let CampusToken: CampusToken;

    let VendorFactory: FHCWVendor__factory;
    let FHCWVendor: FHCWVendor;

    let owner: AddressLike;
    let addr1: AddressLike;
    let addr2: AddressLike;
    let addr3: AddressLike;

    beforeEach(async () => {
        TokenFactory = await ethers.getContractFactory("CampusToken");
        VendorFactory = await ethers.getContractFactory("FHCWVendor");

        [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

        /** For debugging */
        // console.log(`User addresses: ${await addr1.getAddress()}, ${await addr2.getAddress()}, ${await addr3.getAddress()}`)
        // console.log(`Owner addresses: ${await owner.getAddress()}`)

        CampusToken = await TokenFactory.deploy();
        FHCWVendor = await VendorFactory.deploy(CampusToken.target);
        await CampusToken.grantPrivileges(FHCWVendor.target)
    })

    describe("constructor()", () => {
        it("Owner assignment", async () => {
            //@ts-ignore
            expect(await FHCWVendor.owner(), "Wrong owner").to.equal(await owner.getAddress())
        })

        it("Token init amount", async () => {
            expect(await FHCWVendor.campusToken(), "Vendor got wrong Token address").to.eq(CampusToken.target)
        })
    });

    describe("buyTokens()", () => {
        it("Buy 1000 Tokens", async () => {

        })
    })

})