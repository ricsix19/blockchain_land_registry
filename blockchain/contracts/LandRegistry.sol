// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title LandRegistry
/// @notice Minimal on-chain land/property registry for a thesis prototype.
contract LandRegistry {
    address public admin;

    struct Property {
        uint256 propertyId;
        string location;
        uint256 price;
        address currentOwner;
        bool exists;
    }

    mapping(uint256 => Property) private properties;

    event PropertyRegistered(
        uint256 indexed propertyId,
        string location,
        uint256 price,
        address indexed currentOwner
    );

    event PropertyTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "LandRegistry: not admin");
        _;
    }

    function registerProperty(
        uint256 propertyId,
        string memory location,
        uint256 price,
        address initialOwner
    ) external onlyAdmin {
        require(!properties[propertyId].exists, "LandRegistry: duplicate propertyId");
        require(initialOwner != address(0), "LandRegistry: invalid initial owner");

        properties[propertyId] = Property({
            propertyId: propertyId,
            location: location,
            price: price,
            currentOwner: initialOwner,
            exists: true
        });

        emit PropertyRegistered(propertyId, location, price, initialOwner);
    }

    function transferProperty(uint256 propertyId, address newOwner) external {
        Property storage p = properties[propertyId];
        require(p.exists, "LandRegistry: property does not exist");
        require(msg.sender == p.currentOwner, "LandRegistry: not owner");
        require(newOwner != address(0), "LandRegistry: zero address");

        address from = p.currentOwner;
        p.currentOwner = newOwner;

        emit PropertyTransferred(propertyId, from, newOwner);
    }

    function getProperty(uint256 propertyId)
        external
        view
        returns (
            uint256 id,
            string memory location,
            uint256 price,
            address currentOwner,
            bool exists
        )
    {
        Property storage p = properties[propertyId];
        return (p.propertyId, p.location, p.price, p.currentOwner, p.exists);
    }
}
