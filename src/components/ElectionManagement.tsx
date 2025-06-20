import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Edit, Eye, Calendar, X } from 'lucide-react';
import { storage } from '../utils/storage';
import { Election } from '../types';

interface ElectionManagementProps {
  onUpdate: () => void;
}

export const ElectionManagement: React.FC<ElectionManagementProps> = ({ onUpdate }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = () => {
    setElections(storage.getElections());
  };

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const deleteElection = (electionId: string) => {
    if (confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      const updatedElections = elections.filter(e => e.id !== electionId);
      storage.saveElections(updatedElections);
      
      // Also remove related votes
      const votes = storage.getVotes();
      const updatedVotes = votes.filter(v => v.electionId !== electionId);
      storage.saveVotes(updatedVotes);

      storage.addSecurityLog({
        type: 'admin_action',
        message: `Election deleted: ${elections.find(e => e.id === electionId)?.title}`,
        userId: storage.getCurrentUser()?.id,
        electionId: electionId,
        ipAddress: 'localhost',
        severity: 'medium'
      });

      loadElections();
      onUpdate();
    }
  };

  const viewElectionDetails = (election: Election) => {
    setSelectedElection(election);
    setShowDetails(true);
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

  if (showDetails && selectedElection) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Election Details</h2>
          <button
            onClick={() => {
              setShowDetails(false);
              setSelectedElection(null);
            }}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title:</label>
                  <p className="text-gray-900">{selectedElection.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description:</label>
                  <p className="text-gray-900">{selectedElection.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <div className="mt-1">
                    <StatusBadge status={getElectionStatus(selectedElection)} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date:</label>
                  <p className="text-gray-900">{new Date(selectedElection.startDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date:</label>
                  <p className="text-gray-900">{new Date(selectedElection.endDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Votes:</label>
                  <p className="text-gray-900">{selectedElection.totalVotes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Positions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Positions & Candidates</h3>
            <div className="space-y-4">
              {selectedElection.positions.map((position, index) => (
                <div key={position.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">{position.title}</h4>
                    <span className="text-sm text-gray-600">Max votes: {position.maxVotes}</span>
                  </div>
                  {position.description && (
                    <p className="text-sm text-gray-600 mb-3">{position.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {position.candidates.map((candidate) => (
                      <div key={candidate.id} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900">{candidate.name}</h5>
                        {candidate.description && (
                          <p className="text-sm text-gray-600 mt-1">{candidate.description}</p>
                        )}
                        {candidate.manifesto && (
                          <p className="text-xs text-gray-500 mt-2">{candidate.manifesto}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Hash */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Cryptographic Verification</h4>
            <div className="text-xs">
              <span className="font-medium text-blue-700">Hash:</span>
              <br />
              <code className="font-mono text-blue-600 break-all text-xs">
                {selectedElection.cryptographicHash}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Elections</h2>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Elections Created</h3>
          <p className="text-gray-600">
            Create your first election using the "Create Election" tab.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map(election => {
            const status = getElectionStatus(election);
            const votes = storage.getVotesByElection(election.id);
            const uniqueVoters = new Set(votes.map(v => v.voterToken)).size;

            return (
              <div key={election.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{election.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Start:</span>
                        <br />
                        <span className="text-gray-600">
                          {new Date(election.startDate).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">End:</span>
                        <br />
                        <span className="text-gray-600">
                          {new Date(election.endDate).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Positions:</span>
                        <br />
                        <span className="text-gray-600">
                          {election.positions.length}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Votes Cast:</span>
                        <br />
                        <span className="text-gray-600">
                          {votes.length} ({uniqueVoters} voters)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Positions Summary */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Positions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {election.positions.map(position => (
                      <span
                        key={position.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                      >
                        {position.title} ({position.candidates.length} candidates)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => viewElectionDetails(election)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => alert('Edit functionality will be implemented in future updates')}
                    disabled={status === 'active' || status === 'completed'}
                    className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => deleteElection(election.id)}
                    disabled={status === 'active'}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};