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

  it("user can submit purchase request", async function () {
    const [, , owner, buyer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.connect(buyer).requestPurchase(propertyId, buyer.address),
    )
      .to.emit(registry, "PurchaseRequested")
      .withArgs(propertyId, buyer.address);
  });

  it("cannot submit purchase request for non-existing property", async function () {
    const [, , , buyer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await expect(
      registry.connect(buyer).requestPurchase(9999n, buyer.address),
    ).to.be.revertedWith("LandRegistry: property does not exist");
  });

  it("cannot request purchase if buyer is current owner", async function () {
    const [, , owner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.connect(owner).requestPurchase(propertyId, owner.address),
    ).to.be.revertedWith("LandRegistry: already owner");
  });

  it("cannot create a second pending request for the same property", async function () {
    const [, , owner, buyer, other] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);
    await registry.connect(buyer).requestPurchase(propertyId, buyer.address);

    await expect(
      registry.connect(other).requestPurchase(propertyId, other.address),
    ).to.be.revertedWith("LandRegistry: pending exists");
  });

  it("admin can approve purchase request", async function () {
    const [deployer, , owner, buyer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);
    await registry.connect(buyer).requestPurchase(propertyId, buyer.address);

    await expect(registry.connect(deployer).approvePurchaseRequest(propertyId))
      .to.emit(registry, "PurchaseApproved")
      .withArgs(propertyId, buyer.address, owner.address, buyer.address)
      .and.to.emit(registry, "PropertyTransferred")
      .withArgs(propertyId, owner.address, buyer.address);

    const row = await registry.getProperty(propertyId);
    expect(row.currentOwner).to.equal(buyer.address);
    expect(row.pendingTransfer).to.equal(false);
  });

  it("non-admin cannot approve purchase request", async function () {
    const [, , owner, buyer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);
    await registry.connect(buyer).requestPurchase(propertyId, buyer.address);

    await expect(
      registry.connect(buyer).approvePurchaseRequest(propertyId),
    ).to.be.revertedWith("LandRegistry: not admin");
  });

  it("getProperty returns correct owner and pendingTransfer before and after approval", async function () {
    const [deployer, , owner, buyer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    let row = await registry.getProperty(propertyId);
    expect(row.currentOwner).to.equal(owner.address);
    expect(row.pendingTransfer).to.equal(false);

    await registry.connect(buyer).requestPurchase(propertyId, buyer.address);

    row = await registry.getProperty(propertyId);
    expect(row.currentOwner).to.equal(owner.address);
    expect(row.pendingTransfer).to.equal(true);

    await registry.connect(deployer).approvePurchaseRequest(propertyId);

    row = await registry.getProperty(propertyId);
    expect(row.currentOwner).to.equal(buyer.address);
    expect(row.pendingTransfer).to.equal(false);
  });

  it("duplicate propertyId reverts and original data is unchanged", async function () {
    const [, , owner, otherOwner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");
    const otherLocation = "Other Street";
    const otherPrice = ethers.parseEther("2");

    await registry.registerProperty(propertyId, location, price, owner.address);

    const before = await registry.getProperty(propertyId);
    expect(before.location).to.equal(location);
    expect(before.price).to.equal(price);
    expect(before.currentOwner).to.equal(owner.address);
    expect(before.exists).to.equal(true);

    await expect(
      registry.registerProperty(propertyId, otherLocation, otherPrice, otherOwner.address),
    ).to.be.revertedWith("LandRegistry: duplicate propertyId");

    const after = await registry.getProperty(propertyId);
    expect(after.location).to.equal(before.location);
    expect(after.price).to.equal(before.price);
    expect(after.currentOwner).to.equal(before.currentOwner);
    expect(after.exists).to.equal(true);
  });

  it("admin can update property location", async function () {
    const [deployer, , owner] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");
    const newLocation = "Updated Avenue 7";

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(registry.connect(deployer).updatePropertyLocation(propertyId, newLocation))
      .to.emit(registry, "PropertyLocationUpdated")
      .withArgs(propertyId, location, newLocation);

    const row = await registry.getProperty(propertyId);
    expect(row.location).to.equal(newLocation);
    expect(row.price).to.equal(price);
    expect(row.currentOwner).to.equal(owner.address);
  });

  it("non-admin cannot update property location", async function () {
    const [, , owner, other] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await registry.registerProperty(propertyId, location, price, owner.address);

    await expect(
      registry.connect(other).updatePropertyLocation(propertyId, "Hacker Lane"),
    ).to.be.revertedWith("LandRegistry: not admin");
  });

  it("update location for unknown propertyId reverts", async function () {
    const [deployer] = await ethers.getSigners();
    const registry = await ethers.deployContract("LandRegistry");

    await expect(
      registry.connect(deployer).updatePropertyLocation(9999n, "Nowhere"),
    ).to.be.revertedWith("LandRegistry: property does not exist");
  });
});
