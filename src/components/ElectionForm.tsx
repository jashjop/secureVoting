import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { storage } from '../utils/storage';
import { Election, Position, Candidate } from '../types';
import { hashElection } from '../utils/crypto';
import { sanitizeInput, isValidElectionDate, validateCandidateName } from '../utils/validation';

interface ElectionFormProps {
  onElectionCreated: () => void;
}

export const ElectionForm: React.FC<ElectionFormProps> = ({ onElectionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const [positions, setPositions] = useState<Position[]>([{
    id: '1',
    title: '',
    description: '',
    maxVotes: 1,
    candidates: []
  }]);

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addPosition = () => {
    const newPosition: Position = {
      id: Date.now().toString(),
      title: '',
      description: '',
      maxVotes: 1,
      candidates: []
    };
    setPositions([...positions, newPosition]);
  };

  const removePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
  };

  const updatePosition = (positionId: string, field: keyof Position, value: any) => {
    setPositions(positions.map(p => 
      p.id === positionId ? { ...p, [field]: value } : p
    ));
  };

  const addCandidate = (positionId: string) => {
    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: '',
      position: '',
      description: '',
      manifesto: ''
    };

    setPositions(positions.map(p => 
      p.id === positionId 
        ? { ...p, candidates: [...p.candidates, newCandidate] }
        : p
    ));
  };

  const removeCandidate = (positionId: string, candidateId: string) => {
    setPositions(positions.map(p => 
      p.id === positionId 
        ? { ...p, candidates: p.candidates.filter(c => c.id !== candidateId) }
        : p
    ));
  };

  const updateCandidate = (positionId: string, candidateId: string, field: keyof Candidate, value: string) => {
    // Validate candidate name to only allow alphabets
    if (field === 'name' && !validateCandidateName(value) && value !== '') {
      return; // Don't update if invalid characters
    }

    setPositions(positions.map(p => 
      p.id === positionId 
        ? {
            ...p,
            candidates: p.candidates.map(c => 
              c.id === candidateId ? { ...c, [field]: sanitizeInput(value) } : c
            )
          }
        : p
    ));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) newErrors.push('Election title is required');
    if (!formData.description.trim()) newErrors.push('Election description is required');
    if (!formData.startDate) newErrors.push('Start date is required');
    if (!formData.endDate) newErrors.push('End date is required');

    if (!isValidElectionDate(formData.startDate, formData.endDate)) {
      newErrors.push('Invalid date range. Start date must be in the future and end date must be after start date');
    }

    if (positions.length === 0) {
      newErrors.push('At least one position is required');
    }

    positions.forEach((position, index) => {
      if (!position.title.trim()) {
        newErrors.push(`Position ${index + 1}: Title is required`);
      }
      if (position.candidates.length === 0) {
        newErrors.push(`Position ${index + 1}: At least one candidate is required`);
      }
      position.candidates.forEach((candidate, candidateIndex) => {
        if (!candidate.name.trim()) {
          newErrors.push(`Position ${index + 1}, Candidate ${candidateIndex + 1}: Name is required`);
        } else if (!validateCandidateName(candidate.name)) {
          newErrors.push(`Position ${index + 1}, Candidate ${candidateIndex + 1}: Name can only contain alphabets and spaces`);
        }
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const sanitizedFormData = {
      title: sanitizeInput(formData.title),
      description: sanitizeInput(formData.description),
      startDate: formData.startDate,
      endDate: formData.endDate
    };

    const election: Election = {
      id: Date.now().toString(),
      ...sanitizedFormData,
      positions: positions.map(p => ({
        ...p,
        title: sanitizeInput(p.title),
        description: sanitizeInput(p.description),
        maxVotes: 1 // Always 1 vote per position
      })),
      isActive: false,
      totalVotes: 0,
      createdBy: storage.getCurrentUser()?.id || 'admin',
      createdAt: new Date().toISOString(),
      cryptographicHash: ''
    };

    // Generate cryptographic hash
    election.cryptographicHash = hashElection(election);

    const elections = storage.getElections();
    elections.push(election);
    storage.saveElections(elections);

    storage.addSecurityLog({
      type: 'admin_action',
      message: `New election created: ${election.title}`,
      userId: storage.getCurrentUser()?.id,
      electionId: election.id,
      ipAddress: 'localhost',
      severity: 'low'
    });

    // Reset form
    setFormData({ title: '', description: '', startDate: '', endDate: '' });
    setPositions([{ id: '1', title: '', description: '', maxVotes: 1, candidates: [] }]);
    setErrors([]);
    setIsLoading(false);

    onElectionCreated();
    alert('Election created successfully!');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Election</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Election Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Student Council Elections 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the election"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Positions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Positions & Candidates</h3>
            <button
              type="button"
              onClick={addPosition}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Position</span>
            </button>
          </div>

          {positions.map((position, positionIndex) => (
            <div key={position.id} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">
                  Position {positionIndex + 1}
                </h4>
                {positions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePosition(position.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Title
                  </label>
                  <input
                    type="text"
                    value={position.title}
                    onChange={(e) => updatePosition(position.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., President"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={position.description}
                    onChange={(e) => updatePosition(position.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Position responsibilities"
                  />
                </div>
              </div>

              {/* Candidates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900">Candidates</h5>
                  <button
                    type="button"
                    onClick={() => addCandidate(position.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Candidate</span>
                  </button>
                </div>

                {position.candidates.map((candidate, candidateIndex) => (
                  <div key={candidate.id} className="mb-3 p-4 border border-gray-300 rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Candidate {candidateIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCandidate(position.id, candidate.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Candidate Name (Alphabets only)
                        </label>
                        <input
                          type="text"
                          value={candidate.name}
                          onChange={(e) => updateCandidate(position.id, candidate.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 text-sm rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Full name"
                          pattern="[a-zA-Z\s]+"
                          title="Only alphabets and spaces are allowed"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={candidate.description}
                          onChange={(e) => updateCandidate(position.id, candidate.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 text-sm rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Manifesto
                        </label>
                        <textarea
                          value={candidate.manifesto}
                          onChange={(e) => updateCandidate(position.id, candidate.id, 'manifesto', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 text-sm rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                          placeholder="Campaign promises and goals"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {position.candidates.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No candidates added yet</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Please fix the following errors:</h4>
            {errors.map((error, index) => (
              <p key={index} className="text-red-700 text-sm">
                • {error}
              </p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>{isLoading ? 'Creating...' : 'Create Election'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};