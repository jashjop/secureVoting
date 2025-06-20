import React, { useState } from 'react';
import { User, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { validateBnmitEmail, sanitizeInput, validatePassword } from '../utils/validation';
import { storage } from '../utils/storage';
import { generateSecureHash } from '../utils/crypto';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    const sanitizedData = {
      email: sanitizeInput(formData.email.toLowerCase()),
      password: formData.password,
      name: sanitizeInput(formData.name),
      confirmPassword: formData.confirmPassword
    };

    // Validate email domain
    if (!validateBnmitEmail(sanitizedData.email)) {
      setErrors(['Only @bnmit.in email addresses are allowed']);
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      // Login logic
      const user = storage.getUserByEmail(sanitizedData.email);
      if (!user) {
        setErrors(['User not found. Please register first.']);
        storage.addSecurityLog({
          type: 'invalid_access',
          message: `Failed login attempt for email: ${sanitizedData.email}`,
          ipAddress: 'localhost',
          severity: 'medium'
        });
      } else if (!storage.verifyPassword(sanitizedData.password, user.password)) {
        setErrors(['Invalid password']);
        storage.addSecurityLog({
          type: 'invalid_access',
          message: `Invalid password attempt for user: ${user.id}`,
          userId: user.id,
          ipAddress: 'localhost',
          severity: 'high'
        });
      } else {
        storage.addSecurityLog({
          type: 'login',
          message: `User logged in: ${user.email}`,
          userId: user.id,
          ipAddress: 'localhost',
          severity: 'low'
        });
        onLogin(user);
      }
    } else {
      // Registration logic
      const newErrors: string[] = [];

      // Password validation
      const passwordValidation = validatePassword(sanitizedData.password);
      if (!passwordValidation.isValid) {
        newErrors.push(...passwordValidation.errors);
      }

      // Confirm password
      if (sanitizedData.password !== sanitizedData.confirmPassword) {
        newErrors.push('Passwords do not match');
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }

      const existingUser = storage.getUserByEmail(sanitizedData.email);
      if (existingUser) {
        setErrors(['User already exists with this email']);
        setIsLoading(false);
        return;
      }

      const newUser: any = {
        id: Date.now().toString(),
        email: sanitizedData.email,
        password: generateSecureHash(sanitizedData.password), // Hash password
        name: sanitizedData.name,
        role: 'voter',
        isVerified: true,
        hasVoted: {},
        votingTokens: {},
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      const users = storage.getUsers();
      users.push(newUser);
      storage.saveUsers(users);

      storage.addSecurityLog({
        type: 'login',
        message: `New user registered: ${newUser.email}`,
        userId: newUser.id,
        ipAddress: 'localhost',
        severity: 'low'
      });

      onLogin(newUser);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vote BNMIT
            </h1>
            <p className="text-gray-600">
              BNMIT Student Elections
            </p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BNMIT Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="student@bnmit.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.
                  </p>
                </div>
              </>
            )}

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-700 text-sm">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};