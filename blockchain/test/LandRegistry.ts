import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("LandRegistry", function () {
  const propertyId = 1001n;
  const location = "Test Street 1";
  const price = ethers.parseEther("1");

  it("admin can register property", async function () {
    const [deployer, , owner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await expect(
      registry.registerProperty(propertyId, location, price, owner.address),
    )
      .to.emit(registry, "PropertyRegistered")
      .withArgs(propertyId, location, price, owner.address);

    expect(await registry.admin()).to.equal(deployer.address);
  });

  it("non-admin cannot register property", async function () {
    const [, , owner, other] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await expect(
      registry
        .connect(other)
        .registerProperty(propertyId, location, price, owner.address),
    ).to.be.revertedWith("LandRegistry: not admin");
  });

  it("owner can transfer property", async function () {
    const [, , owner, newOwner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.connect(owner).transferProperty(propertyId, newOwner.address),
    )
      .to.emit(registry, "PropertyTransferred")
      .withArgs(propertyId, owner.address, newOwner.address);
  });

  it("non-owner cannot transfer property", async function () {
    const [, , owner, other, newOwner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.connect(other).transferProperty(propertyId, newOwner.address),
    ).to.be.revertedWith("LandRegistry: not owner");
  });

  it("getProperty returns correct values", async function () {
    const [, , owner, newOwner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    let row = await registry.getProperty(propertyId);
    expect(row.id).to.equal(propertyId);
    expect(row.location).to.equal(location);
    expect(row.price).to.equal(price);
    expect(row.currentOwner).to.equal(owner.address);
    expect(row.exists).to.equal(true);

    await registry.connect(owner).transferProperty(propertyId, newOwner.address);

    row = await registry.getProperty(propertyId);
    expect(row.currentOwner).to.equal(newOwner.address);
    expect(row.exists).to.equal(true);
  });

  it("duplicate propertyId reverts", async function () {
    const [, , owner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.registerProperty(propertyId, "Other", price, owner.address),
    ).to.be.revertedWith("LandRegistry: duplicate propertyId");
  });

  it("transfer unknown property reverts", async function () {
    const [, , , other] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await expect(
      registry.connect(other).transferProperty(9999n, other.address),
    ).to.be.revertedWith("LandRegistry: property does not exist");
  });

  it("transfer to zero address reverts", async function () {
    const [, , owner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry
        .connect(owner)
        .transferProperty(propertyId, ethers.ZeroAddress),
    ).to.be.revertedWith("LandRegistry: zero address");
  });
});
