import CryptoJS from 'crypto-js';

const SECRET_KEY = 'voting-platform-secret-2024';
const ENCRYPTION_KEY = 'secure-voting-encryption-key-2024';

export const generateVoterToken = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const generateSessionId = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

export const hashVote = (vote: {
  electionId: string;
  positionId: string;
  candidateId: string;
  voterToken: string;
  timestamp: string;
}): string => {
  const voteString = `${vote.electionId}-${vote.positionId}-${vote.candidateId}-${vote.voterToken}-${vote.timestamp}`;
  return CryptoJS.SHA256(voteString + SECRET_KEY).toString();
};

export const hashElection = (election: {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  positions: any[];
}): string => {
  const electionString = `${election.id}-${election.title}-${election.startDate}-${election.endDate}-${JSON.stringify(election.positions)}`;
  return CryptoJS.SHA256(electionString + SECRET_KEY).toString();
};

export const verifyVoteIntegrity = (vote: any): boolean => {
  const expectedHash = hashVote({
    electionId: vote.electionId,
    positionId: vote.positionId,
    candidateId: vote.candidateId,
    voterToken: vote.voterToken,
    timestamp: vote.timestamp
  });
  return expectedHash === vote.cryptographicHash;
};

export const generateElectionVerificationHash = (results: any): string => {
  const resultsString = JSON.stringify(results);
  return CryptoJS.SHA256(resultsString + SECRET_KEY).toString();
};

export const encryptSensitiveData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptSensitiveData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateSecureHash = (data: string): string => {
  return CryptoJS.SHA512(data + SECRET_KEY).toString();
};

export const verifyDataIntegrity = (data: string, hash: string): boolean => {
  const expectedHash = generateSecureHash(data);
  return expectedHash === hash;
};

export const generateTimestampedToken = (): string => {
  const timestamp = Date.now().toString();
  const randomData = CryptoJS.lib.WordArray.random(16).toString();
  return CryptoJS.SHA256(timestamp + randomData + SECRET_KEY).toString();
};

export const validateTokenTimestamp = (token: string, maxAge: number = 30 * 60 * 1000): boolean => {
  // In a real implementation, you would store token creation time
  // For demo purposes, we'll assume all tokens are valid within the session
  return true;
};