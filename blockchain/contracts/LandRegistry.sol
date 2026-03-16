// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LandRegistry {
    // State variable to store the address of the contract administrator
    address public Admin;

    constructor() {
        Admin = msg.sender;
    }

    // Struct to represent a land parcel
    struct Property {
        uint id;
        string location;
        uint price;
        address owner;
        bool isForSale;
    }

    mapping(uint => Property) public properties;
    uint public propertyCount = 0;

    function registryProperty(string memory _location, uint _price) public {
        require(
            msg.sender == Admin,
            "Csak a Foldhivatal altal felruhazott szemely regisztralhat ingatlant."
        );
        propertyCount++;

        properties[propertyCount] = Property(
            propertyCount,
            _location,
            _price,
            Admin,
            true
        );
    }
}
