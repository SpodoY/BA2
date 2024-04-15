import { expect } from "chai";
import { ethers } from "hardhat";
import { CampusToken, CampusToken__factory, FHCWVendor, FHCWVendor__factory } from "../typechain-types";
import hre from "hardhat";
import { AddressLike } from "ethers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe('FHCWVendor', () => {
    //global vars
    const provider = ethers.provider;

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

        const roleHash = await CampusToken.PRIV_ROLE();
        await CampusToken.grantRole(roleHash, FHCWVendor.target)

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

            // @ts-ignore
            const rewardees = [await addr1.getAddress(), await addr2.getAddress()]
            await expect(FHCWVendor.multipleReward(rewardAmount, rewardees)).to.be.revertedWith("Rewards not available yet")

        })

        it("Reward for 2 people", async () => {

            // @ts-ignore
            const rewardees = [await addr1.getAddress(), await addr2.getAddress()]

            await mine(20)

            await FHCWVendor.multipleReward(rewardAmount, rewardees)

            rewardees.forEach(async rewardee => {
                expect(await CampusToken.balanceOf(rewardee), `Not ${rewardAmount} Tokens`).to.eq(rewardAmount)
            });
        })
    })

    describe('randomReward()', () => {

        it("Rollback since block not reached yet", async () => {

            // @ts-ignore
            await FHCWVendor.connect(addr1).randomReward()
            await expect(FHCWVendor.connect(addr1).randomReward()).to.be.revertedWith("No reward available yet - Try again later")

        })

        it("Reward granted", async () => {

            //Type any due to typescript not able to recognize 'AddressLike' as an address
            const rewardee: any = addr1


            // Mine frist block instantaneously
            await FHCWVendor.connect(rewardee).randomReward()
            const firstReward = await CampusToken.balanceOf(rewardee)
            // console.log(firstReward) // For debugging

            // Mine amount of blocks to 'skip' 1 day and 10 minutes
            await mine((24 * 60 * 60 + 10 * 60) / 6)


            await FHCWVendor.connect(rewardee).randomReward()
            const secondReward = await CampusToken.balanceOf(rewardee) - firstReward
            // console.log(secondReward) // For debugging

            expect(await CampusToken.balanceOf(rewardee), `Balance of rewardee is 0!`).to.gt(0)
            expect(firstReward, `Rewards are equal :(`).to.not.eq(secondReward)

            // console.log(await CampusToken.balanceOf(rewardee)) // For debugging
        })
    })

    describe('riddleReward()', () => {
        it("Solve riddle", async () => {

            await owner.sendTransaction({
                to: FHCWVendor.target,
                value: ethers.parseEther("10")
            })

            await FHCWVendor.connect(addr1).riddleReward("Raccoon");

            expect(await provider.getBalance(addr1), "Account should have more than 10000 ETH").to.be.gt(ethers.parseEther("10000"))
            expect(await provider.getBalance(FHCWVendor.target), "Contract should have 8 ETH left").to.eq(ethers.parseEther("8"))

        })

        it("Riddle already solved", async () => {

            //@ts-ignore
            await owner.sendTransaction({
                to: FHCWVendor.target,
                value: ethers.parseEther("10")
            })
    
            await FHCWVendor.connect(addr1).riddleReward("Raccoon");
    
            expect(await provider.getBalance(addr1), "Account should have more than 10000 ETH").to.be.gt(ethers.parseEther("10000"))
            expect(await provider.getBalance(FHCWVendor.target), "Contract should have 8 ETH left").to.eq(ethers.parseEther("8"))
    
            await expect(FHCWVendor.connect(addr2).riddleReward("Raccoon")).to.be.revertedWith("The riddle has been solved already, wait for the next riddle")
    
        })

    })

})