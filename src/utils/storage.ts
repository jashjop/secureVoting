import { User, Election, Vote, VotingSession, SecurityLog, ElectionResults } from '../types';
import { encryptSensitiveData, decryptSensitiveData, generateSecureHash } from './crypto';

class SecureStorage {
  private encrypt = (data: any): string => {
    return encryptSensitiveData(JSON.stringify(data));
  };

  private decrypt = (encryptedData: string): any => {
    try {
      return JSON.parse(decryptSensitiveData(encryptedData));
    } catch {
      return null;
    }
  };

  // Initialize admin account with secure credentials
  initializeAdminAccount(): void {
    const users = this.getUsers();
    const adminExists = users.find(u => u.role === 'admin');
    
    if (!adminExists) {
      const adminUser: User = {
        id: 'admin-' + Date.now(),
        email: 'admin@bnmit.in',
        password: generateSecureHash('VoteBNMIT2024!Admin'), // Hashed password
        name: 'System Administrator',
        role: 'admin',
        isVerified: true,
        hasVoted: {},
        votingTokens: {},
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      users.push(adminUser);
      this.saveUsers(users);
    }
  }

  // User management
  getUsers(): User[] {
    const encrypted = localStorage.getItem('voting_users');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveUsers(users: User[]): void {
    localStorage.setItem('voting_users', this.encrypt(users));
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  // Secure password verification
  verifyPassword(inputPassword: string, storedPassword: string): boolean {
    const hashedInput = generateSecureHash(inputPassword);
    return hashedInput === storedPassword;
  }

  // Elections management
  getElections(): Election[] {
    const encrypted = localStorage.getItem('voting_elections');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveElections(elections: Election[]): void {
    localStorage.setItem('voting_elections', this.encrypt(elections));
  }

  getElectionById(id: string): Election | null {
    const elections = this.getElections();
    return elections.find(election => election.id === id) || null;
  }

  // Votes management
  getVotes(): Vote[] {
    const encrypted = localStorage.getItem('voting_votes');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveVotes(votes: Vote[]): void {
    localStorage.setItem('voting_votes', this.encrypt(votes));
  }

  getVotesByElection(electionId: string): Vote[] {
    const votes = this.getVotes();
    return votes.filter(vote => vote.electionId === electionId);
  }

  // Check if user has already voted in an election
  hasUserVotedInElection(userId: string, electionId: string): boolean {
    const user = this.getUsers().find(u => u.id === userId);
    return user?.hasVoted?.[electionId] === true;
  }

  // Voting sessions management
  getVotingSessions(): VotingSession[] {
    const encrypted = localStorage.getItem('voting_sessions');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveVotingSessions(sessions: VotingSession[]): void {
    localStorage.setItem('voting_sessions', this.encrypt(sessions));
  }

  getActiveSession(electionId: string, voterToken: string): VotingSession | null {
    const sessions = this.getVotingSessions();
    return sessions.find(session => 
      session.electionId === electionId && 
      session.voterToken === voterToken && 
      session.isActive &&
      new Date(session.expiresAt) > new Date()
    ) || null;
  }

  // Security logs management
  getSecurityLogs(): SecurityLog[] {
    const encrypted = localStorage.getItem('voting_security_logs');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveSecurityLogs(logs: SecurityLog[]): void {
    localStorage.setItem('voting_security_logs', this.encrypt(logs));
  }

  addSecurityLog(log: Omit<SecurityLog, 'id' | 'timestamp'>): void {
    const logs = this.getSecurityLogs();
    const newLog: SecurityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    this.saveSecurityLogs(logs);
  }

  // Results management
  getElectionResults(): ElectionResults[] {
    const encrypted = localStorage.getItem('voting_results');
    return encrypted ? this.decrypt(encrypted) || [] : [];
  }

  saveElectionResults(results: ElectionResults[]): void {
    localStorage.setItem('voting_results', this.encrypt(results));
  }

  // Current user session
  getCurrentUser(): User | null {
    const encrypted = localStorage.getItem('voting_current_user');
    return encrypted ? this.decrypt(encrypted) : null;
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('voting_current_user', this.encrypt(user));
    } else {
      localStorage.removeItem('voting_current_user');
    }
  }

  // Clear all data (for admin purposes)
  clearAllData(): void {
    const keys = [
      'voting_users',
      'voting_elections',
      'voting_votes',
      'voting_sessions',
      'voting_security_logs',
      'voting_results',
      'voting_current_user'
    ];
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const storage = new SecureStorage();

// Initialize admin account on app start
storage.initializeAdminAccount();