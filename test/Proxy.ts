import { assert, expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ContractFactory } from "ethers";

let factory: ContractFactory<any[]>;
let factoryV2: ContractFactory<any[]>;

describe('SecretStorage', () => {

    before('get factories', async () => {
        factory = await ethers.getContractFactory("SecretStorage")
        factoryV2 = await ethers.getContractFactory("SecretStorageV2")
    })

    it('deploy', async () => {
        const secretStorage = await factory.deploy();
        await secretStorage.initialize()

        assert(await secretStorage.getSecret() === "VerySecure")
    })

    it('deploy upgradeable', async () => {
        const secretStorage = await upgrades.deployProxy(factory, {kind: 'uups'})

        assert(await secretStorage.getSecret() === "VerySecure")

        const secretStorageV2 = await upgrades.upgradeProxy(secretStorage, factoryV2)

        const versionNum = await secretStorageV2.version()

        assert(versionNum === 2n)
        assert(secretStorage.target === secretStorageV2.target)
    })
    

})