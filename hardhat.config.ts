import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("@nomicfoundation/hardhat-toolbox");

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
        auto: false,
        interval: 1000
      }
    }
  }
};

export default config;
