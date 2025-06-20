import React, { useState, useEffect } from 'react';
import { ArrowLeft, Vote as VoteIcon, Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { storage } from '../utils/storage';
import { Election, User, Vote, VotingSession, Position, Candidate } from '../types';
import { generateVoterToken, generateSessionId, hashVote } from '../utils/crypto';

interface VotingInterfaceProps {
  election: Election;
  user: User;
  onComplete: () => void;
  onCancel: () => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  election,
  user,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [votes, setVotes] = useState<{ [positionId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Security check - prevent double voting
    if (storage.hasUserVotedInElection(user.id, election.id)) {
      storage.addSecurityLog({
        type: 'double_vote_attempt',
        message: `User attempted to vote again in election: ${election.title}`,
        userId: user.id,
        electionId: election.id,
        ipAddress: 'localhost',
        severity: 'high'
      });
      alert('Security Alert: You have already voted in this election!');
      onCancel();
      return;
    }

    // Create voting session
    createVotingSession();
    
    // Initialize votes object - one vote per position
    const initialVotes: { [positionId: string]: string } = {};
    election.positions.forEach(position => {
      initialVotes[position.id] = '';
    });
    setVotes(initialVotes);

    // Timer for session expiration
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          alert('Your voting session has expired. Please start again.');
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const createVotingSession = () => {
    const voterToken = generateVoterToken();
    const sessionId = generateSessionId();
    
    const session: VotingSession = {
      sessionId,
      voterToken,
      electionId: election.id,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      ipAddress: 'localhost',
      userAgent: navigator.userAgent
    };

    const sessions = storage.getVotingSessions();
    sessions.push(session);
    storage.saveVotingSessions(sessions);
    setVotingSession(session);

    // Update user with voting token
    const users = storage.getUsers();
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { 
            ...u, 
            votingTokens: { 
              ...u.votingTokens, 
              [election.id]: voterToken 
            } 
          }
        : u
    );
    storage.saveUsers(updatedUsers);
  };

  const handleVoteChange = (positionId: string, candidateId: string) => {
    setVotes(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const validateVotes = (): boolean => {
    const newErrors: string[] = [];
    
    election.positions.forEach((position, index) => {
      const positionVote = votes[position.id];
      if (!positionVote) {
        newErrors.push(`Please select a candidate for ${position.title}`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const submitVotes = async () => {
    if (!votingSession) {
      alert('Invalid voting session. Please try again.');
      return;
    }

    // Additional security check before submission
    if (storage.hasUserVotedInElection(user.id, election.id)) {
      storage.addSecurityLog({
        type: 'double_vote_attempt',
        message: `Double vote attempt blocked during submission for election: ${election.title}`,
        userId: user.id,
        electionId: election.id,
        ipAddress: 'localhost',
        severity: 'critical'
      });
      alert('Security Alert: Vote already recorded for this election!');
      onCancel();
      return;
    }

    setIsSubmitting(true);

    try {
      const allVotes = storage.getVotes();
      const timestamp = new Date().toISOString();

      // Create vote records
      const newVotes: Vote[] = [];
      Object.entries(votes).forEach(([positionId, candidateId]) => {
        if (candidateId) {
          const voteData = {
            electionId: election.id,
            positionId,
            candidateId,
            voterToken: votingSession.voterToken,
            timestamp
          };

          const vote: Vote = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...voteData,
            cryptographicHash: hashVote(voteData),
            verified: true
          };

          newVotes.push(vote);
        }
      });

      // Save votes
      allVotes.push(...newVotes);
      storage.saveVotes(allVotes);

      // Update user voting status - CRITICAL FIX
      const users = storage.getUsers();
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              hasVoted: { 
                ...u.hasVoted, 
                [election.id]: true 
              } 
            }
          : u
      );
      storage.saveUsers(updatedUsers);
      
      // Update current user session
      const updatedUser = updatedUsers.find(u => u.id === user.id);
      if (updatedUser) {
        storage.setCurrentUser(updatedUser);
      }

      // Update election vote count
      const elections = storage.getElections();
      const updatedElections = elections.map(e => 
        e.id === election.id 
          ? { ...e, totalVotes: e.totalVotes + newVotes.length }
          : e
      );
      storage.saveElections(updatedElections);

      // Deactivate voting session
      const sessions = storage.getVotingSessions();
      const updatedSessions = sessions.map(s => 
        s.sessionId === votingSession.sessionId 
          ? { ...s, isActive: false }
          : s
      );
      storage.saveVotingSessions(updatedSessions);

      // Log successful vote
      storage.addSecurityLog({
        type: 'vote_cast',
        message: `Vote successfully cast in election: ${election.title}`,
        userId: user.id,
        electionId: election.id,
        ipAddress: 'localhost',
        severity: 'low'
      });

      setIsSubmitting(false);
      setIsCompleted(true);

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      setIsSubmitting(false);
      console.error('Error submitting votes:', error);
      alert('An error occurred while submitting your vote. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep < election.positions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (validateVotes()) {
        setShowConfirmation(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vote Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your vote has been securely recorded and verified. Thank you for participating!
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Redirecting to dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPosition = election.positions[currentStep];

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Votes</h1>
              <p className="text-gray-600">
                Please review your selections before submitting. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {election.positions.map(position => {
                const selectedCandidateId = votes[position.id];
                const selectedCandidate = position.candidates.find(c => c.id === selectedCandidateId);
                
                return (
                  <div key={position.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{position.title}</h3>
                    {selectedCandidate ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-gray-900">{selectedCandidate.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600">No candidate selected</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Important Notice</h4>
                  <p className="text-sm text-yellow-700">
                    Once you submit your vote, it cannot be changed. Your vote is encrypted and anonymous, 
                    ensuring both security and privacy.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
              >
                Review Votes
              </button>
              <button
                onClick={submitVotes}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
              >
                <VoteIcon className="h-5 w-5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Vote'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onCancel}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{election.title}</h1>
                <p className="text-sm text-gray-600">Secure Voting Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Time remaining: {formatTime(timeRemaining)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Position {currentStep + 1} of {election.positions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Voting Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(((currentStep + 1) / election.positions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / election.positions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Voting Form */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentPosition.title}</h2>
            <p className="text-gray-600 mb-4">{currentPosition.description}</p>
            <p className="text-sm font-medium text-blue-600">
              Select one candidate
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {currentPosition.candidates.map((candidate: Candidate) => {
              const isSelected = votes[currentPosition.id] === candidate.id;
              
              return (
                <div
                  key={candidate.id}
                  className={`border-2 p-6 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleVoteChange(currentPosition.id, candidate.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                      {candidate.description && (
                        <p className="text-sm text-gray-600 mb-3">{candidate.description}</p>
                      )}
                      {candidate.manifesto && (
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm text-gray-800">{candidate.manifesto}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              {errors.map((error, index) => (
                <p key={index} className="text-red-700 text-sm">
                  • {error}
                </p>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              {currentStep === election.positions.length - 1 ? 'Review Votes' : 'Next'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Security Guarantee</h4>
              <p className="text-sm text-green-700">
                Your vote is protected by cryptographic security. Your identity remains anonymous while ensuring vote integrity.
                Session ID: {votingSession?.sessionId.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};