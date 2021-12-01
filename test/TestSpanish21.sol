// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Spanish21.sol";

contract TestSpanish21 {

    uint public initialBalance = 2 ether;
    Spanish21 casino;
    UserAgent ploppy;
    UserAgent squatter;

    constructor() public payable {}

    // Run before each test
    function beforeAll() public {
        casino = new Spanish21();
        ploppy = new UserAgent(casino);
        squatter = new UserAgent(casino);

        address(ploppy).transfer(10000 wei);
    }

    //// payout Tests
    //function testHere() public {}
}




/// @notice Contract to create user to interact with Spanish21 contract (i.e., a Casino visitor)
contract UserAgent {

    Spanish21 thisCasino;

    constructor(Spanish21 _casino) public payable {
        thisCasino = _casino;
    }

    fallback() external {}
    receive() external payable {}

    function kill() public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("kill()"));
        return success;
    }

    function newRound(uint bet) public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("newRound({value: uint256})", bet));
        return success;
    }

    function split(uint bet) public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("split({value: uint256)", bet));
        return success;
    }

    function doubleDown(uint bet) public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("doubleDown({value: uint256})", bet));
        return success;
    }

    function hit() public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("hit()"));
        return success;
    }

    function stand() public returns(bool) {
        (bool success, ) = address(thisCasino).call(abi.encodeWithSignature("stand()"));
        return success;
    }
}
