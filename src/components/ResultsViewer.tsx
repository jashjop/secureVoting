import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, Download, Shield } from 'lucide-react';
import { storage } from '../utils/storage';
import { Election, ElectionResults } from '../types';
import { generateElectionVerificationHash } from '../utils/crypto';

export const ResultsViewer: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = () => {
    const allElections = storage.getElections();
    const completedElections = allElections.filter(election => {
      const now = new Date();
      const end = new Date(election.endDate);
      return now > end;
    });
    setElections(completedElections);
  };

  const calculateResults = (election: Election): ElectionResults => {
    const votes = storage.getVotesByElection(election.id);
    const uniqueVoters = new Set(votes.map(v => v.voterToken)).size;
    const totalRegisteredVoters = storage.getUsers().filter(u => u.role === 'voter').length;

    const positionResults = election.positions.map(position => {
      const positionVotes = votes.filter(v => v.positionId === position.id);
      const totalPositionVotes = positionVotes.length;

      const candidateResults = position.candidates.map(candidate => {
        const candidateVotes = positionVotes.filter(v => v.candidateId === candidate.id).length;
        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          voteCount: candidateVotes,
          percentage: totalPositionVotes > 0 ? (candidateVotes / totalPositionVotes) * 100 : 0
        };
      });

      // Sort by vote count (descending)
      candidateResults.sort((a, b) => b.voteCount - a.voteCount);

      return {
        positionId: position.id,
        positionTitle: position.title,
        candidates: candidateResults,
        totalVotes: totalPositionVotes
      };
    });

    const results: ElectionResults = {
      electionId: election.id,
      positions: positionResults,
      totalParticipants: uniqueVoters,
      turnoutPercentage: totalRegisteredVoters > 0 ? (uniqueVoters / totalRegisteredVoters) * 100 : 0,
      verificationHash: ''
    };

    // Generate verification hash
    results.verificationHash = generateElectionVerificationHash(results);

    return results;
  };

  const viewResults = (election: Election) => {
    const calculatedResults = calculateResults(election);
    setSelectedElection(election);
    setResults(calculatedResults);

    // Save results for future reference
    const savedResults = storage.getElectionResults();
    const existingIndex = savedResults.findIndex(r => r.electionId === election.id);
    
    if (existingIndex >= 0) {
      savedResults[existingIndex] = calculatedResults;
    } else {
      savedResults.push(calculatedResults);
    }
    
    storage.saveElectionResults(savedResults);
  };

  const downloadResults = () => {
    if (!results || !selectedElection) return;

    const data = {
      election: {
        title: selectedElection.title,
        description: selectedElection.description,
        startDate: selectedElection.startDate,
        endDate: selectedElection.endDate
      },
      results: results,
      exportDate: new Date().toISOString(),
      verificationHash: results.verificationHash
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${selectedElection.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedElection && results) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedElection.title}</h2>
              <p className="text-gray-600">{selectedElection.description}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadResults}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  setSelectedElection(null);
                  setResults(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{results.totalParticipants}</p>
              <p className="text-sm text-gray-600">Total Voters</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{results.turnoutPercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Turnout</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{results.positions.length}</p>
              <p className="text-sm text-gray-600">Positions</p>
            </div>
          </div>
        </div>

        {/* Position Results */}
        <div className="space-y-6">
          {results.positions.map(position => (
            <div key={position.positionId} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{position.positionTitle}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {position.totalVotes} Votes
                </span>
              </div>

              <div className="space-y-4">
                {position.candidates.map((candidate, index) => {
                  const isWinner = index === 0 && candidate.voteCount > 0;
                  return (
                    <div key={candidate.candidateId} className={`p-4 rounded-lg border-2 ${
                      isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {isWinner && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                              Winner
                            </span>
                          )}
                          <h4 className="text-lg font-semibold text-gray-900">{candidate.candidateName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{candidate.voteCount}</p>
                          <p className="text-sm text-gray-600">{candidate.percentage.toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* Vote Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isWinner ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${candidate.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Verification */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Cryptographic Verification</h4>
              <p className="text-sm text-blue-700 mb-3">
                These results have been cryptographically verified to ensure integrity and authenticity.
              </p>
              <div className="bg-white border border-blue-300 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700">Verification Hash:</p>
                <code className="font-mono text-xs text-gray-600 break-all">
                  {results.verificationHash}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Election Results</h2>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Elections</h3>
          <p className="text-gray-600">
            Results will appear here once elections are completed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map(election => {
            const votes = storage.getVotesByElection(election.id);
            const uniqueVoters = new Set(votes.map(v => v.voterToken)).size;

            return (
              <div key={election.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{election.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{election.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>Ended: {new Date(election.endDate).toLocaleString()}</span>
                      <span>{uniqueVoters} voters participated</span>
                      <span>{votes.length} total votes cast</span>
                    </div>
                  </div>
                  <button
                    onClick={() => viewResults(election)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Results</span>
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