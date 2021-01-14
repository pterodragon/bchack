pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@statechannels/nitro-protocol/contracts/interfaces/IForceMoveApp.sol';
import '@statechannels/nitro-protocol/contracts/Outcome.sol';

contract CountingApp is ForceMoveApp {
  struct CountingAppData {
    uint256 counter;
  }

  function appData(bytes memory appDataBytes) internal pure returns (CountingAppData memory) {
    return abi.decode(appDataBytes, (CountingAppData));
  }

  function validTransition(
    VariablePart memory a,
    VariablePart memory b,
    uint256 turnNumB,
    uint256 nParticipants
  ) public pure override returns (bool) {
    require(
      appData(b.appData).counter == appData(a.appData).counter + 1,
      'CountingApp: Counter must be incremented'
    );
    require(keccak256(b.outcome) == keccak256(a.outcome), 'CountingApp: Outcome must not change');
    return true;
  }
}
