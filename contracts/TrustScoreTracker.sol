// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Trust Score Tracker
/// @notice A contract for couples to record trust events with encrypted scores
/// @dev All trust scores are encrypted using FHE, protecting privacy while allowing encrypted operations
contract TrustScoreTracker is SepoliaConfig {
    /// @notice Emitted when a new trust event is recorded
    /// @param user The address of the user who recorded the event
    /// @param eventCount The updated event count for the user
    event TrustEventRecorded(address indexed user, uint32 eventCount);

    /// @notice Emitted when trust scores are queried
    /// @param user The address of the user whose scores were queried
    /// @param queryType The type of query performed (0: recording, 1: single, 2: range)
    event TrustScoreQueried(address indexed user, uint8 queryType);

    /// @notice Emitted when decryption is requested for a user
    /// @param user The address of the user requesting decryption
    /// @param requestType The type of decryption requested (0: total, 1: average, 2: range)
    event DecryptionRequested(address indexed user, uint8 requestType);
    // Mapping from user address to array of encrypted trust scores
    mapping(address => euint32[]) private _userTrustScores;
    
    // Mapping from user address to encrypted total trust score
    mapping(address => euint32) private _userTotalScore;
    
    // Mapping from user address to encrypted average trust score
    mapping(address => euint32) private _userAverageScore;
    
    // Mapping from user address to count of trust events (plaintext for division)
    mapping(address => uint32) private _userEventCount;

    // Mapping from user address to last activity timestamp
    mapping(address => uint32) private _userLastActivity;

    /// @notice Record a new trust event with an encrypted score
    /// @param score The encrypted trust score (typically 1-10)
    /// @param inputProof The input proof for the encrypted score
    /// @dev The score is added to the user's trust history and updates their total
    function recordTrustEvent(externalEuint32 score, bytes calldata inputProof) external {
        require(inputProof.length > 0, "Proof cannot be empty");
        require(_userEventCount[msg.sender] < 1000, "Maximum trust events reached");

        // Convert external encrypted value to internal euint32 (validates the proof)
        euint32 encryptedScore = FHE.fromExternal(score, inputProof);

        // Add to user's trust scores array
        _userTrustScores[msg.sender].push(encryptedScore);
        FHE.allowThis(encryptedScore);
        FHE.allow(encryptedScore, msg.sender);

        // Update total score
        _userTotalScore[msg.sender] = FHE.add(_userTotalScore[msg.sender], encryptedScore);

        // Increment event count (plaintext)
        _userEventCount[msg.sender] += 1;

        // Update last activity timestamp
        _userLastActivity[msg.sender] = uint32(block.timestamp);

        // Allow contract and user to access the encrypted values
        FHE.allowThis(_userTotalScore[msg.sender]);
        FHE.allow(_userTotalScore[msg.sender], msg.sender);

        // Update encrypted average score (only if event count changed)
        uint32 eventCount = _userEventCount[msg.sender];
        if (eventCount > 0) {
            // Cache FHE operations to reduce gas costs
            euint32 totalScore = _userTotalScore[msg.sender];
            euint32 average = FHE.div(totalScore, eventCount);
            _userAverageScore[msg.sender] = average;
            FHE.allowThis(_userAverageScore[msg.sender]);
            FHE.allow(_userAverageScore[msg.sender], msg.sender);
        }

        // Emit event for tracking
        emit TrustEventRecorded(msg.sender, eventCount);

        // Emit query event for consistency tracking
        emit TrustScoreQueried(msg.sender, 0); // 0 indicates recording operation
    }

    /// @notice Get the encrypted total trust score for a user
    /// @param user The address of the user
    /// @return The encrypted total trust score
    function getTotalTrustScore(address user) external view returns (euint32) {
        require(user != address(0), "Invalid user address");
        return _userTotalScore[user];
    }

    /// @notice Get the count of trust events for a user
    /// @param user The address of the user
    /// @return The count of trust events (plaintext)
    function getTrustEventCount(address user) external view returns (uint32) {
        return _userEventCount[user];
    }

    /// @notice Get the encrypted average trust score for a user
    /// @param user The address of the user
    /// @return The encrypted average trust score (total / count)
    function getAverageTrustScore(address user) external view returns (euint32) {
        require(user != address(0), "Invalid user address");
        return _userAverageScore[user];
    }

    /// @notice Get the number of trust events for a user (unencrypted, for array length)
    /// @param user The address of the user
    /// @return The number of trust events recorded
    function getTrustEventArrayLength(address user) external view returns (uint256) {
        require(user != address(0), "Invalid user address");
        return _userTrustScores[user].length;
    }

    /// @notice Get the last activity timestamp for a user
    /// @param user The address of the user
    /// @return The timestamp of the user's last trust event recording
    function getLastActivityTimestamp(address user) external view returns (uint32) {
        require(user != address(0), "Invalid user address");
        return _userLastActivity[user];
    }

    /// @notice Get a specific encrypted trust score from a user's history by index
    /// @param user The address of the user
    /// @param index The index of the trust score to retrieve
    /// @return The encrypted trust score at the specified index
    function getTrustScoreByIndex(address user, uint256 index) external view returns (euint32) {
        require(user != address(0), "Invalid user address");
        require(index < _userTrustScores[user].length, "Index out of bounds");
        return _userTrustScores[user][index];
    }

    /// @notice Get multiple trust scores from a user's history within a range
    /// @param user The address of the user
    /// @param startIndex The starting index (inclusive)
    /// @param endIndex The ending index (exclusive)
    /// @return An array of encrypted trust scores
    function getTrustScoreRange(address user, uint256 startIndex, uint256 endIndex) external view returns (euint32[] memory) {
        require(user != address(0), "Invalid user address");
        require(startIndex < endIndex, "Invalid range");
        require(endIndex <= _userTrustScores[user].length, "End index out of bounds");

        uint256 length = endIndex - startIndex;
        euint32[] memory scores = new euint32[](length);

        for (uint256 i = 0; i < length; i++) {
            scores[i] = _userTrustScores[user][startIndex + i];
        }

        return scores;
    }

    /// @notice Validate if a trust score is within acceptable range (1-10)
    /// @param score The encrypted trust score to validate
    /// @param inputProof The input proof for the score
    /// @return isValid True if score is between 1-10 inclusive
    function validateTrustScore(externalEuint32 score, bytes calldata inputProof) external view returns (bool) {
        require(inputProof.length > 0, "Proof cannot be empty");

        euint32 encryptedScore = FHE.fromExternal(score, inputProof);

        // Check if score is >= 1 and <= 10
        euint32 minScore = FHE.asEuint32(1);
        euint32 maxScore = FHE.asEuint32(10);

        ebool isGreaterOrEqualMin = FHE.gte(encryptedScore, minScore);
        ebool isLessOrEqualMax = FHE.lte(encryptedScore, maxScore);

        ebool isValid = FHE.and(isGreaterOrEqualMin, isLessOrEqualMax);

        return FHE.decrypt(isValid);
    }
}

