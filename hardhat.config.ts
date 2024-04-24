import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@chainlink/hardhat-chainlink";
import 'dotenv/config'
import "@nomicfoundation/hardhat-ignition-ethers";
import "secp256k1"
// require("@nomicfoundation/hardhat-toolbox");

const { INFURA_API_KEY, MNEMONIC, REPORT_GAS, COINMAKERKET_API_KEY } = process.env


const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.7.6"
      }
    ],
  },
  networks: {
    hardhat: {
      gas: "auto",
      mining: {
        auto: true,
        // interval: 1000
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      //@ts-ignore
      accounts: [MNEMONIC],
    },
  }
};

export default config;
