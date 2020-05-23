pragma solidity ^0.6.0;

/**
 * @title TesterContract2
 * @author Dill Pickles
 * @dev A contract for testing
 * the ability of this forked doc generator
 * to make clean output files.
 *
 * It should ideally support proper linebreaks
 * but only when they are desired.
 *
 * Another cool thing is
 * the ability to make lists like such:
 * - this is the first item
 * this should still be part of #1
 * - this is the second item
 */
contract TesterContract2 {
  uint256 private abc;

  /**
   * @dev This section should appear under developer notes.
   * @param a The first parameter, which may or may not be overloaded.
   * @param b The second parameter, which is good for eating spaghettios with.
   * @return The product of `a` and `b`
   */
  function test1(uint256 a, uint256 b) public view returns(uint256) {
    return a*b + abc * 20;
  }

  /**
   * @dev This section should appear directly under the function name, because
   * I will only provide a markdown input for the first function.
   * @param a The first parameter, which may or may not be overloaded.
   * @return The product of `a` and `20`
   */
  function test1(uint256 a) public pure returns(uint256) {
    return a*20;
  }
}