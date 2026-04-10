import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LandRegistryModule", (m) => {
  const landRegistry = m.contract("LandRegistry");
  return { landRegistry };
});
