import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Info, CheckCircle, XCircle, Download } from 'lucide-react';
import { storage } from '../utils/storage';
import { SecurityLog } from '../types';

export const SecurityMonitor: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadLogs = () => {
    const allLogs = storage.getSecurityLogs();
    setLogs(allLogs.reverse()); // Most recent first
  };

  const getFilteredLogs = () => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.severity === filter);
  };

  const getLogStats = () => {
    const recent = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logTime > oneDayAgo;
    });

    return {
      total: recent.length,
      critical: recent.filter(l => l.severity === 'critical').length,
      high: recent.filter(l => l.severity === 'high').length,
      medium: recent.filter(l => l.severity === 'medium').length,
      low: recent.filter(l => l.severity === 'low').length
    };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { bg: 'bg-red-100', text: 'text-red-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      low: { bg: 'bg-green-100', text: 'text-green-800' }
    }[severity] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all security logs? This action cannot be undone.')) {
      storage.saveSecurityLogs([]);
      setLogs([]);
    }
  };

  const exportLogs = () => {
    const data = {
      logs: logs,
      exportDate: new Date().toISOString(),
      totalLogs: logs.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = getLogStats();
  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total (24H)</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-sm font-medium text-red-800">Critical</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            <p className="text-sm font-medium text-orange-800">High</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
            <p className="text-sm font-medium text-yellow-800">Medium</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.low}</p>
            <p className="text-sm font-medium text-green-800">Low</p>
          </div>
        </div>
      </div>

      {/* Security Logs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Security Logs</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(log.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(log.severity)}
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1">{log.message}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {log.userId && <span>User: {log.userId}</span>}
                    {log.electionId && <span>Election: {log.electionId}</span>}
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Logs Found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No security logs have been recorded yet.'
                  : `No ${filter} level security logs found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Features Active</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Email Domain Validation</h4>
              <p className="text-sm text-green-700">Only @bnmit.in emails accepted</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Cryptographic Security</h4>
              <p className="text-sm text-green-700">All votes cryptographically hashed</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Double Voting Prevention</h4>
              <p className="text-sm text-green-700">One vote per user per election</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Anonymous Voting</h4>
              <p className="text-sm text-green-700">Voter identity protected with tokens</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Session Management</h4>
              <p className="text-sm text-green-700">Secure voting sessions with expiration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Input Sanitization</h4>
              <p className="text-sm text-green-700">All inputs sanitized against XSS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};