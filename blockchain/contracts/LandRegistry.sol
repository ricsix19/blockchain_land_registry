// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LandRegistry {
    address public Admin;

    constructor() {
        Admin = msg.sender;
    }
}