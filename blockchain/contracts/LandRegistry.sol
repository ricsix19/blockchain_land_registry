// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LandRegistry {
    address public admin;

    struct Property {
        uint256 propertyId;
        string location;
        uint256 price;
        address currentOwner;
        bool exists;
    }

    struct PurchaseRequest {
        address buyer;
    }

    mapping(uint256 => Property) private properties;
    mapping(uint256 => PurchaseRequest) private purchaseRequests;

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

    event PurchaseRequested(uint256 indexed propertyId, address indexed buyer);

    event PurchaseApproved(
        uint256 indexed propertyId,
        address indexed buyer,
        address from,
        address to
    );

    event PropertyLocationUpdated(
        uint256 indexed propertyId,
        string oldLocation,
        string newLocation
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "LandRegistry: not admin");
        _;
    }

    // Új ingatlan regisztrálása
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

    function updatePropertyLocation(uint256 propertyId, string memory newLocation) external onlyAdmin {
        Property storage p = properties[propertyId];
        require(p.exists, "LandRegistry: property does not exist");
        require(bytes(newLocation).length > 0, "LandRegistry: empty location");
        require(
            keccak256(bytes(newLocation)) != keccak256(bytes(p.location)),
            "LandRegistry: same location"
        );
        string memory oldLocation = p.location;
        p.location = newLocation;
        emit PropertyLocationUpdated(propertyId, oldLocation, newLocation);
    }

    // Vásárlási kérelem küldése
    function requestPurchase(uint256 propertyId, address buyer) external {
        Property storage p = properties[propertyId];
        require(p.exists, "LandRegistry: property does not exist");
        require(buyer != address(0), "LandRegistry: invalid buyer");
        require(buyer != p.currentOwner, "LandRegistry: already owner");
        require(
            purchaseRequests[propertyId].buyer == address(0),
            "LandRegistry: pending exists"
        );

        purchaseRequests[propertyId].buyer = buyer;
        emit PurchaseRequested(propertyId, buyer);
    }

    // Vásárlási kérelem jóváhagyása
    function approvePurchaseRequest(uint256 propertyId) external onlyAdmin {
        Property storage p = properties[propertyId];
        require(p.exists, "LandRegistry: property does not exist");
        address buyer = purchaseRequests[propertyId].buyer;
        require(buyer != address(0), "LandRegistry: no pending");

        delete purchaseRequests[propertyId];

        address from = p.currentOwner;
        p.currentOwner = buyer;

        emit PurchaseApproved(propertyId, buyer, from, buyer);
        emit PropertyTransferred(propertyId, from, buyer);
    }

    function getProperty(uint256 propertyId)
        external
        view
        returns (
            uint256 id,
            string memory location,
            uint256 price,
            address currentOwner,
            bool exists,
            bool pendingTransfer
        )
    {
        Property storage p = properties[propertyId];
        pendingTransfer = purchaseRequests[propertyId].buyer != address(0);
        return (p.propertyId, p.location, p.price, p.currentOwner, p.exists, pendingTransfer);
    }
}
