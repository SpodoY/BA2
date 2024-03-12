import { expect } from "chai";
import { ethers } from "hardhat";
import { CampusToken, CampusToken__factory } from "../typechain-types";
import hre from "hardhat";

describe('CampusToken', () => {
    //global vars
    let TokenFactory: CampusToken__factory;
    let CampusToken: CampusToken;
    let owner: { address: any; };
    let addr1;
    let addr2;

    beforeEach(async () => {
        TokenFactory = await ethers.getContractFactory("CampusToken");
        [owner, addr1, addr2] = await hre.ethers.getSigners();

        CampusToken = await TokenFactory.deploy();
    })

    describe("Deployment", () => {
        it("Owner assignment", async () => {
            expect(await CampusToken.owner()).to.equal(owner.address)
        })
    });

    describe("Give addr1 100 Tokens", () => {
        it("")
    })

})