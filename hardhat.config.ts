import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("@nomicfoundation/hardhat-toolbox");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  // networks: {
  //   hardhat: {
  //     mining: {
  //       auto: false,
  //       interval: [3000, 6000]
  //     }
  //   }
  // }
};

export default config;
