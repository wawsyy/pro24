import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { TrustScoreTracker, TrustScoreTracker__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("TrustScoreTracker")) as TrustScoreTracker__factory;
  const trustScoreTracker = (await factory.deploy()) as TrustScoreTracker;
  const contractAddress = await trustScoreTracker.getAddress();

  return { trustScoreTracker, contractAddress };
}

describe("TrustScoreTracker", function () {
  let signers: Signers;
  let trustScoreTracker: TrustScoreTracker;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ trustScoreTracker, contractAddress } = await deployFixture());
  });

  it("should initialize with zero total score and zero event count", async function () {
    const encryptedTotal = await trustScoreTracker.getTotalTrustScore(signers.alice.address);
    const encryptedCount = await trustScoreTracker.getTrustEventCount(signers.alice.address);
    
    // Expect initial values to be bytes32(0) (uninitialized)
    expect(encryptedTotal).to.eq(ethers.ZeroHash);
    expect(encryptedCount).to.eq(ethers.ZeroHash);
  });

  it("should record a trust event and update totals", async function () {
    const score = 8;
    
    // Encrypt the trust score
    const encryptedScore = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(score)
      .encrypt();

    // Record the trust event
    const tx = await trustScoreTracker
      .connect(signers.alice)
      .recordTrustEvent(encryptedScore.handles[0], encryptedScore.inputProof);
    await tx.wait();

    // Check total score
    const encryptedTotal = await trustScoreTracker.getTotalTrustScore(signers.alice.address);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );
    expect(clearTotal).to.eq(score);

    // Check event count (now plaintext)
    const count = await trustScoreTracker.getTrustEventCount(signers.alice.address);
    expect(count).to.eq(1);
  });

  it("should record multiple trust events and accumulate totals", async function () {
    const scores = [7, 9, 8, 10];
    let expectedTotal = 0;

    for (const score of scores) {
      expectedTotal += score;
      
      const encryptedScore = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(score)
        .encrypt();

      const tx = await trustScoreTracker
        .connect(signers.alice)
        .recordTrustEvent(encryptedScore.handles[0], encryptedScore.inputProof);
      await tx.wait();
    }

    // Verify total score
    const encryptedTotal = await trustScoreTracker.getTotalTrustScore(signers.alice.address);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );
    expect(clearTotal).to.eq(expectedTotal);

    // Verify event count (now plaintext)
    const count = await trustScoreTracker.getTrustEventCount(signers.alice.address);
    expect(count).to.eq(scores.length);

    // Verify array length
    const arrayLength = await trustScoreTracker.getTrustEventArrayLength(signers.alice.address);
    expect(arrayLength).to.eq(scores.length);
  });

  it("should allow different users to have separate trust scores", async function () {
    const aliceScore = 8;
    const bobScore = 9;

    // Alice records a trust event
    const aliceEncrypted = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceScore)
      .encrypt();
    await trustScoreTracker
      .connect(signers.alice)
      .recordTrustEvent(aliceEncrypted.handles[0], aliceEncrypted.inputProof);

    // Bob records a trust event
    const bobEncrypted = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobScore)
      .encrypt();
    await trustScoreTracker
      .connect(signers.bob)
      .recordTrustEvent(bobEncrypted.handles[0], bobEncrypted.inputProof);

    // Verify Alice's score
    const aliceTotal = await trustScoreTracker.getTotalTrustScore(signers.alice.address);
    const aliceClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceTotal,
      contractAddress,
      signers.alice,
    );
    expect(aliceClear).to.eq(aliceScore);

    // Verify Bob's score
    const bobTotal = await trustScoreTracker.getTotalTrustScore(signers.bob.address);
    const bobClear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobTotal,
      contractAddress,
      signers.bob,
    );
    expect(bobClear).to.eq(bobScore);
  });

  it("should retrieve trust score by index", async function () {
    const scores = [7, 9, 8];
    
    // Record multiple events
    for (const score of scores) {
      const encryptedScore = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(score)
        .encrypt();
      await trustScoreTracker
        .connect(signers.alice)
        .recordTrustEvent(encryptedScore.handles[0], encryptedScore.inputProof);
    }

    // Retrieve and verify each score by index
    for (let i = 0; i < scores.length; i++) {
      const encryptedScore = await trustScoreTracker.getTrustScoreByIndex(signers.alice.address, i);
      const clearScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedScore,
        contractAddress,
        signers.alice,
      );
      expect(clearScore).to.eq(scores[i]);
    }
  });

  it("should track last activity timestamp", async function () {
    const score = 8;

    // Record a trust event
    const encryptedScore = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(score)
      .encrypt();

    const tx = await trustScoreTracker
      .connect(signers.alice)
      .recordTrustEvent(encryptedScore.handles[0], encryptedScore.inputProof);
    await tx.wait();

    // Verify timestamp was recorded (should be greater than 0)
    const lastActivity = await trustScoreTracker.getLastActivityTimestamp(signers.alice.address);
    expect(lastActivity).to.be.gt(0);
  });

  it("should reject invalid user addresses in query functions", async function () {
    const zeroAddress = ethers.ZeroAddress;

    // Test getTrustScoreByIndex with zero address
    await expect(trustScoreTracker.getTrustScoreByIndex(zeroAddress, 0))
      .to.be.revertedWith("Invalid user address");

    // Test getTrustScoreRange with zero address
    await expect(trustScoreTracker.getTrustScoreRange(zeroAddress, 0, 1))
      .to.be.revertedWith("Invalid user address");

    // Test getTotalTrustScore with zero address (should work, returns zero)
    const totalScore = await trustScoreTracker.getTotalTrustScore(zeroAddress);
    expect(totalScore).to.eq(ethers.ZeroHash);

    // Test getAverageTrustScore with zero address (should work, returns zero)
    const averageScore = await trustScoreTracker.getAverageTrustScore(zeroAddress);
    expect(averageScore).to.eq(ethers.ZeroHash);
  });

  it("should handle range queries correctly", async function () {
    // Record multiple trust events
    await trustScoreTracker.connect(signers.alice).recordTrustEvent(
      await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(8).encrypt(),
      "0x" + "12".repeat(32)
    );
    await trustScoreTracker.connect(signers.alice).recordTrustEvent(
      await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(9).encrypt(),
      "0x" + "12".repeat(32)
    );
    await trustScoreTracker.connect(signers.alice).recordTrustEvent(
      await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(10).encrypt(),
      "0x" + "12".repeat(32)
    );

    // Test valid range query
    const rangeScores = await trustScoreTracker.getTrustScoreRange(signers.alice.address, 0, 2);
    expect(rangeScores.length).to.eq(2);

    // Test invalid range (start >= end)
    await expect(trustScoreTracker.getTrustScoreRange(signers.alice.address, 2, 2))
      .to.be.revertedWith("Invalid range");

    // Test out of bounds range
    await expect(trustScoreTracker.getTrustScoreRange(signers.alice.address, 0, 10))
      .to.be.revertedWith("End index out of bounds");
  });

  it("should enforce maximum trust events limit", async function () {
    // Record 999 events (just below the limit)
    for (let i = 0; i < 999; i++) {
      await trustScoreTracker.connect(signers.alice).recordTrustEvent(
        await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(5).encrypt(),
        "0x" + "12".repeat(32)
      );
    }

    // Verify count is 999
    const eventCount = await trustScoreTracker.getTrustEventCount(signers.alice.address);
    expect(eventCount).to.eq(999);

    // Try to record the 1000th event - should fail
    await expect(trustScoreTracker.connect(signers.alice).recordTrustEvent(
      await fhevm.createEncryptedInput(contractAddress, signers.alice.address).add32(5).encrypt(),
      "0x" + "12".repeat(32)
    )).to.be.revertedWith("Maximum trust events reached");
  });
});

