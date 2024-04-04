import { expect } from "chai";
import { ethers } from "hardhat";
import { CampusToken, CampusToken__factory, FHCWVendor, FHCWVendor__factory } from "../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe('FHCWVendor', () => {
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
        CampusToken.waitForDeployment();

        FHCWVendor = await VendorFactory.deploy(CampusToken.target);
        FHCWVendor.waitForDeployment();

        await CampusToken.grantPrivileges(FHCWVendor.target)

        // Equals 50.000 Tokens
        const initialVendorTokens = 500_000

        // Mint tokens for FHCWVendor and add them to the VendorContract address
        await CampusToken.mint(FHCWVendor.target, initialVendorTokens);

        // console.log(await CampusToken.hasPriv(FHCWVendor.target) ? `Is priviliged` : `Didn't get priviliges`) // For debugging
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

    describe('multipleReward()', () => {

        const rewardAmount = 1000
        
        it("Rollback since block not reached yet", async () => {

            const rewardees = [await addr1.getAddress(), await addr2.getAddress()]
            expect(FHCWVendor.multipleReward(rewardAmount, rewardees)).to.be.revertedWith("Rewards not available yet")
            
        })

        it("Reward for 2 people", async () => {

            const rewardees = [await addr1.getAddress(), await addr2.getAddress()]
            
            await mine(20)

            await FHCWVendor.multipleReward(rewardAmount, rewardees)

            rewardees.forEach(async rewardee => {
                expect(await CampusToken.balanceOf(rewardee), `Not ${rewardAmount} Tokens`).to.eq(rewardAmount)
            });
        })
    })

})