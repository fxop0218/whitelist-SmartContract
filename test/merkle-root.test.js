const { expect } = require("chai")
const keccak256 = require("keccak256")
const { MerkleTree } = require("merkletreejs")
const { ethers } = require("hardhat")

// Encode leaf function
function encodeLeaf(address, spots) {
    return ethers.utils.defaultAbiCoder.encode(["address", "uint64"], [address, spots])
}

describe("Check if merkle root is working", function () {
    it("Should be able to verify if a given address is in whitelist or not", async function () {
        // Get a bunch of test addresses
        const [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners()

        // Create an array of elements you wish to encode in the Merkle Tree
        const list = [
            encodeLeaf(owner.address, 2),
            encodeLeaf(addr1.address, 2),
            encodeLeaf(addr2.address, 2),
            encodeLeaf(addr3.address, 2),
            encodeLeaf(addr4.address, 2),
            encodeLeaf(addr5.address, 2),
        ]

        const merkleTree = new MerkleTree(list, keccak256, {
            hashLeaves: true,
            sortPairs: true,
        })
        // Compute the Merkle Root
        const root = merkleTree.getHexRoot()

        // Deploy the Whitelist contract
        const whitelistContract = await ethers.getContractFactory("Whitelist")
        const whitelist = await whitelistContract.deploy(root)
        await whitelist.deployed()

        // Compute the Merkle Proof of the owner address (0'th item in list)
        // off-chain. The leaf node is the hash of that value.
        const leaf = keccak256(list[0])
        const proof = merkleTree.getHexProof(leaf)

        let verified = await whitelist.checkInWhitelist(proof, 2)
        expect(verified).to.equal(true)

        verified = await whitelist.checkInWhitelist([], 2)
        expect(verified).to.equal(false)
    })
})
