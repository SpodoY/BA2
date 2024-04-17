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
        await CampusToken.waitForDeployment()

        FHCWVendor = await VendorFactory.deploy(CampusToken.target);
        await FHCWVendor.waitForDeployment()

        const roleHash = await CampusToken.PRIV_ROLE();
        await CampusToken.grantRole(roleHash, FHCWVendor.target)
    })

    describe("constructor()", () => {
        it("Owner assignment", async () => {
            // @ts-ignore
            expect(await CampusToken.owner(), "Wrong owner").to.equal(await owner.getAddress())
        })

        it("Token init amount", async () => {
            expect(await CampusToken.totalSupply(), "Total supply was not 100.000").to.eq(1_000_000)
        })
    });

    describe("mint()", () => {
        it("Mint 100 Tokens for Addr1", async () => {
            await CampusToken.mint(addr1, 100 * 10 ^ Number(CampusToken.decimals))
            
            expect(await CampusToken.balanceOf(addr1)).to.not.eq(100)
            expect(await CampusToken.balanceOf(addr1)).to.eq(1_000)
        })
    })

    describe('tranfer()', () => {
        it("Transfer from `addr1` to `addr2`", async () => {
            await CampusToken.transfer(addr1, 100)

            expect(await CampusToken.balanceOf(owner)).to.eq(1_000_000 - 100)
            expect(await CampusToken.balanceOf(addr1)).to.eq(100)
        })

        it("Insufficient balance", async () => {
            expect(CampusToken.transfer(addr1, 10_000_000_000)).to.be.revertedWith("Insufficient balance")
        })
    })

    describe('tranfserFrom()', () => {
        it("Failed transfer - No allowance", async () => {
            const transferAmount = 1000

            await CampusToken.mint(addr1, transferAmount)

            //@ts-ignore
            expect(CampusToken.connect(addr3).transferFrom(addr1, addr2, transferAmount)).to.be.revertedWith("Allowance exceeded")
        })

        it("Successful transfer", async () => {
            const transferAmount = 1_000
            const addr1BalanceBeforeTransfer = await CampusToken.balanceOf(addr1)
            const addr2BalanceBeforeTransfer = await CampusToken.balanceOf(addr2)

            await CampusToken.mint(addr1, transferAmount)

            //@ts-ignore
            await CampusToken.connect(addr1).approve(addr3, transferAmount)

            console.log(`Allowance for 3: ${await CampusToken.allowance(addr1, addr3)}`)

            //@ts-ignore
            await CampusToken.connect(addr3).transferFrom(addr1, addr2, transferAmount)

            expect(await CampusToken.balanceOf(addr1), "Addr1 should have 0 Tokens").to.eq(addr1BalanceBeforeTransfer)
            expect(await CampusToken.balanceOf(addr2), "Addr2 should have 1000 Tokens").to.eq(Number(addr2BalanceBeforeTransfer) + transferAmount)
        })
    })

})