// //SPDX-License-Identifier: MIT

// pragma solidity ^0.8.0;

// import "../Raffle.sol";

// error TestHelper__SaysNoThanks();

// contract TestHelper {

//     Raffle raffle;

//     constructor(address rafAddr) {
//         raffle = Raffle(rafAddr);
//     }
//     receive() external payable{
//         revert TestHelper__SaysNoThanks();
//     }

//     function enterRaffle() public payable {
//         raffle.enterRaffle{value: msg.value}();
//     }
// }