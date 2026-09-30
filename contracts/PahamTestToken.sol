// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PahamTestToken {
    string public name = "PAHAM Test Token";
    string public symbol = "PTT";
    uint8 public decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor() {
        totalSupply = 1_000_000 * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;

        emit Transfer(
            address(0),
            msg.sender,
            totalSupply
        );
    }

    function transfer(
        address to,
        uint256 amount
    ) external returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);

        return true;
    }

    function approve(
        address spender,
        uint256 amount
    ) external returns (bool) {
        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= amount, "Insufficient balance");

        uint256 allowed = allowance[from][msg.sender];

        require(allowed >= amount, "Insufficient allowance");

        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);

        return true;
    }
}
