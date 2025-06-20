# Vote BNMIT
Secure voting application for BNMIT elections.

To set up:
1. Clone this repository
2. In command window
   cd # file location
   npm install
   npm run dev

Security feastures:
1. Authentication & Access Control
Email Domain Restriction: Only @bnmit.in emails accepted
Strong Password Policy: 8+ characters with uppercase, lowercase, numbers, and special characters
Password Confirmation: Double verification during registration
Session Management: Secure user sessions with proper logout
Role-Based Access: Separate admin and voter interfaces
2. Cryptographic Security
Vote Hashing: SHA-256 cryptographic hashing for each vote
Election Integrity: Cryptographic hashes for election verification
Result Verification: Verification hashes for result authenticity
Data Encryption: AES encryption for sensitive data storage
Secure Tokens: Cryptographically secure voter tokens
Timestamped Tokens: Time-based token validation
3. Voting Security
Double Voting Prevention: System tracks and prevents multiple votes
Anonymous Voting: Voter tokens separate identity from vote content
Session Expiration: 30-minute voting sessions with countdown timer
Vote Integrity: Each vote includes cryptographic verification
Tamper Detection: System can detect if votes have been modified
4. Session Security
Secure Sessions: Voting sessions with unique IDs and expiration
IP Tracking: Session tracking includes IP addresses for audit
Browser Fingerprinting: User agent tracking for additional security
Session Validation: Integrity checks for all voting sessions
Automatic Expiration: Sessions automatically expire after 30 minutes
5. Input Validation & Sanitization
XSS Prevention: All inputs sanitized against cross-site scripting
SQL Injection Protection: Secure data handling practices
Email Validation: Strict email format and domain validation
Data Sanitization: All user inputs cleaned and validated
Form Validation: Comprehensive client and server-side validation
