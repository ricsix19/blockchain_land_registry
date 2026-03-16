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

    function buyProperty(uint _id) public payable {
        Property storage prop = properties[_id];

        require(prop.isForSale == true, "Ez az ingatlan nem megvasarolhato");
        require(msg.value >= prop.price, "Nincs elegendo penze az ingatlan vasarlasahoz!");
        require(prop.owner != msg.sender, "A sajat ingatlanat nem vasarolhatja meg!");

        address previousOwner = prop.owner;

        prop.owner = msg.sender;
        prop.isForSale = false;

        payable(previousOwner).transfer(msg.value);
    }

    function putOnSale(uint _id, uint _newPrice) public {
        require(properties[_id].owner == msg.sender, "Csak az ingatlan tulajdonosa teheti eladasra az ingatlant!");
        properties[_id].isForSale = true;
        properties[_id].price = _newPrice;
    }
}
