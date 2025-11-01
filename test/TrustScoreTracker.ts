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
});

