import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  LogOut
} from 'lucide-react';
import { storage } from '../utils/storage';
import { Election, User, SecurityLog, ElectionResults } from '../types';
import { ElectionForm } from './ElectionForm';
import { ElectionManagement } from './ElectionManagement';
import { SecurityMonitor } from './SecurityMonitor';
import { ResultsViewer } from './ResultsViewer';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'elections' | 'create' | 'security' | 'results'>('overview');
  const [elections, setElections] = useState<Election[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setElections(storage.getElections());
    setUsers(storage.getUsers());
    setSecurityLogs(storage.getSecurityLogs().slice(-50)); // Last 50 logs
  };

  const getElectionStats = () => {
    const active = elections.filter(e => {
      const now = new Date();
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return now >= start && now <= end;
    }).length;

    const upcoming = elections.filter(e => {
      const now = new Date();
      const start = new Date(e.startDate);
      return now < start;
    }).length;

    const completed = elections.filter(e => {
      const now = new Date();
      const end = new Date(e.endDate);
      return now > end;
    }).length;

    return { active, upcoming, completed, total: elections.length };
  };

  const getSecurityStats = () => {
    const recent = securityLogs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logTime > oneDayAgo;
    });

    const critical = recent.filter(log => log.severity === 'critical').length;
    const high = recent.filter(log => log.severity === 'high').length;
    const medium = recent.filter(log => log.severity === 'medium').length;

    return { total: recent.length, critical, high, medium };
  };

  const electionStats = getElectionStats();
  const securityStats = getSecurityStats();
  const voterCount = users.filter(u => u.role === 'voter').length;

  const TabButton: React.FC<{ 
    id: string; 
    icon: React.ReactNode; 
    label: string; 
    isActive: boolean;
    onClick: () => void;
  }> = ({ id, icon, label, isActive, onClick }) => (
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
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
            id="overview"
            icon={<BarChart3 className="h-4 w-4" />}
            label="Overview"
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="elections"
            icon={<Settings className="h-4 w-4" />}
            label="Manage Elections"
            isActive={activeTab === 'elections'}
            onClick={() => setActiveTab('elections')}
          />
          <TabButton
            id="create"
            icon={<Plus className="h-4 w-4" />}
            label="Create Election"
            isActive={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
          />
          <TabButton
            id="security"
            icon={<Shield className="h-4 w-4" />}
            label="Security"
            isActive={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          />
          <TabButton
            id="results"
            icon={<Eye className="h-4 w-4" />}
            label="Results"
            isActive={activeTab === 'results'}
            onClick={() => setActiveTab('results')}
          />
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Elections</p>
                    <p className="text-3xl font-bold text-gray-900">{electionStats.total}</p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Elections</p>
                    <p className="text-3xl font-bold text-green-600">{electionStats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Registered Voters</p>
                    <p className="text-3xl font-bold text-gray-900">{voterCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                    <p className="text-3xl font-bold text-red-600">{securityStats.critical + securityStats.high}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Election Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Election Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{electionStats.active}</p>
                  <p className="text-sm font-medium text-green-800">Active</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{electionStats.upcoming}</p>
                  <p className="text-sm font-medium text-yellow-800">Upcoming</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <XCircle className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-600">{electionStats.completed}</p>
                  <p className="text-sm font-medium text-gray-800">Completed</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Activity</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {securityLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        log.severity === 'critical' ? 'bg-red-500' :
                        log.severity === 'high' ? 'bg-orange-500' :
                        log.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{log.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'elections' && (
          <ElectionManagement onUpdate={loadData} />
        )}

        {activeTab === 'create' && (
          <ElectionForm onElectionCreated={loadData} />
        )}

        {activeTab === 'security' && (
          <SecurityMonitor />
        )}

        {activeTab === 'results' && (
          <ResultsViewer />
        )}
      </div>
    </div>
  );
};