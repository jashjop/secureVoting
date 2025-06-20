import React, { useState, useEffect } from 'react';
import { 
  Vote as VoteIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Shield,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { storage } from '../utils/storage';
import { User, Election } from '../types';
import { VotingInterface } from './VotingInterface';

interface VoterDashboardProps {
  user: User;
  onLogout: () => void;
}

export const VoterDashboard: React.FC<VoterDashboardProps> = ({ user, onLogout }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'voted' | 'results'>('available');

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = () => {
    const allElections = storage.getElections();
    setElections(allElections);
  };

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const hasUserVoted = (electionId: string) => {
    return user.hasVoted?.[electionId] === true;
  };

  const getAvailableElections = () => {
    return elections.filter(election => {
      const status = getElectionStatus(election);
      return status === 'active' && !hasUserVoted(election.id);
    });
  };

  const getVotedElections = () => {
    return elections.filter(election => hasUserVoted(election.id));
  };

  const getCompletedElections = () => {
    return elections.filter(election => getElectionStatus(election) === 'completed');
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'active':
          return { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' };
        case 'upcoming':
          return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Upcoming' };
        case 'completed':
          return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' };
        default:
          return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
      }
    };

    const config = getStatusConfig();
    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full`}>
        {config.label}
      </span>
    );
  };

  const ElectionCard: React.FC<{ 
    election: Election; 
    showVoteButton?: boolean;
    showResultsButton?: boolean;
    voted?: boolean;
  }> = ({ election, showVoteButton, showResultsButton, voted }) => {
    const status = getElectionStatus(election);
    
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{election.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{election.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Start: {new Date(election.startDate).toLocaleString()}</span>
              <span>End: {new Date(election.endDate).toLocaleString()}</span>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {election.positions.length} Position{election.positions.length !== 1 ? 's' : ''}
            </span>
            {voted && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Voted</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {showVoteButton && (
              <button
                onClick={() => setSelectedElection(election)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <VoteIcon className="h-4 w-4" />
                <span>Vote Now</span>
              </button>
            )}
            
            {showResultsButton && (
              <button
                onClick={() => {/* TODO: Show results */}}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>View Results</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TabButton: React.FC<{ 
    id: string; 
    icon: React.ReactNode; 
    label: string; 
    count: number;
    isActive: boolean;
    onClick: () => void;
  }> = ({ id, icon, label, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-700'
      }`}>
        {count}
      </span>
    </button>
  );

  if (selectedElection) {
    return (
      <VotingInterface
        election={selectedElection}
        user={user}
        onComplete={() => {
          setSelectedElection(null);
          loadElections();
          // Refresh user data
          const updatedUser = storage.getUserByEmail(user.email);
          if (updatedUser) {
            storage.setCurrentUser(updatedUser);
          }
        }}
        onCancel={() => setSelectedElection(null)}
      />
    );
  }

  const availableElections = getAvailableElections();
  const votedElections = getVotedElections();
  const completedElections = getCompletedElections();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <VoteIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Voter Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          <TabButton
            id="available"
            icon={<VoteIcon className="h-4 w-4" />}
            label="Available to Vote"
            count={availableElections.length}
            isActive={activeTab === 'available'}
            onClick={() => setActiveTab('available')}
          />
          <TabButton
            id="voted"
            icon={<CheckCircle className="h-4 w-4" />}
            label="Already Voted"
            count={votedElections.length}
            isActive={activeTab === 'voted'}
            onClick={() => setActiveTab('voted')}
          />
          <TabButton
            id="results"
            icon={<Eye className="h-4 w-4" />}
            label="View Results"
            count={completedElections.length}
            isActive={activeTab === 'results'}
            onClick={() => setActiveTab('results')}
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'available' && (
            <>
              {availableElections.length > 0 ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-800">
                        You have {availableElections.length} election{availableElections.length !== 1 ? 's' : ''} available for voting!
                      </p>
                    </div>
                  </div>
                  {availableElections.map(election => (
                    <ElectionCard
                      key={election.id}
                      election={election}
                      showVoteButton={true}
                    />
                  ))}
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Elections Available</h3>
                  <p className="text-gray-600">
                    There are currently no active elections you can vote in. Check back later!
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'voted' && (
            <>
              {votedElections.length > 0 ? (
                votedElections.map(election => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    voted={true}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Votes Cast Yet</h3>
                  <p className="text-gray-600">
                    You haven't voted in any elections yet. Check the available elections tab!
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'results' && (
            <>
              {completedElections.length > 0 ? (
                completedElections.map(election => (
                  <ElectionCard
                    key={election.id}
                    election={election}
                    showResultsButton={true}
                    voted={hasUserVoted(election.id)}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Elections</h3>
                  <p className="text-gray-600">
                    No elections have been completed yet. Results will appear here when available.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Security Notice</h4>
              <p className="text-sm text-blue-700">
                Your votes are cryptographically secured and anonymous. Your identity is protected while ensuring vote integrity.
                Only verified @bnmit.in email addresses can participate in elections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};