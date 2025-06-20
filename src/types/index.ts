export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'voter';
  isVerified: boolean;
  hasVoted?: { [electionId: string]: boolean };
  votingTokens?: { [electionId: string]: string };
  registrationDate: string;
  lastLogin: string;
  password: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  description: string;
  manifesto: string;
  photo?: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  positions: Position[];
  isActive: boolean;
  totalVotes: number;
  createdBy: string;
  createdAt: string;
  cryptographicHash: string;
}

export interface Position {
  id: string;
  title: string;
  description: string;
  candidates: Candidate[];
  maxVotes: number; // For positions where you can vote for multiple candidates
}

export interface Vote {
  id: string;
  electionId: string;
  positionId: string;
  candidateId: string;
  voterToken: string; // Anonymous token, not linked to voter identity
  timestamp: string;
  cryptographicHash: string;
  verified: boolean;
}

export interface VotingSession {
  sessionId: string;
  voterToken: string;
  electionId: string;
  isActive: boolean;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

export interface SecurityLog {
  id: string;
  type: 'login' | 'vote_cast' | 'double_vote_attempt' | 'invalid_access' | 'admin_action' | 'session_expired' | 'suspicious_activity';
  message: string;
  userId?: string;
  electionId?: string;
  timestamp: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export interface ElectionResults {
  electionId: string;
  positions: {
    positionId: string;
    positionTitle: string;
    candidates: {
      candidateId: string;
      candidateName: string;
      voteCount: number;
      percentage: number;
    }[];
    totalVotes: number;
  }[];
  totalParticipants: number;
  turnoutPercentage: number;
  verificationHash: string;
}

export interface AuditTrail {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  details: any;
  ipAddress: string;
}

export interface SystemHealth {
  totalUsers: number;
  activeElections: number;
  totalVotes: number;
  securityAlerts: number;
  systemUptime: string;
  lastBackup: string;
}