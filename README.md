# solmd

MarkDown documentation generator for Solidity.

Forked from [soldoc](https://github.com/HQ20/soldoc)

## Notes
The Solidity parser needs to be updated, some of the features from Solidity 0.6+ are not supported. Abstract contracts are an example. 

## Install
> npm i -g solmd

## Usage
> solmd docs/ contracts/

If your contracts directory includes markdown files with a filename of either README.md or CONTRACTFILE.md, and the markdown file includes a header with the same name as the contract, the documentation found in the markdown file will be mixed in with the generated documentation.

### Example
Solidity File
```
// Contract.sol

contract Contract
  /**
   * @dev Comments from natspec
   */
  function test() public view returns (uint256) {
      return 55;
  }
```

Markdown Input
```md
// Contract.md

# Contract

## test
Comments from markdown file.
```

Output File
```md
// Contract.md
# Contract

# Functions
## test()
Comments from markdown file.

**Developer Notes**
Comments from natspec
```
