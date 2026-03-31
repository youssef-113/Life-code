const { getFirestore } = require('../config/firebase');

/**
 * Account Lock Middleware - Protects against brute force attacks
 * Tracks failed login attempts and temporarily locks accounts
 */

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const PROGRESSIVE_DELAY_BASE_MS = 1000; // 1 second base delay

/**
 * Track failed login attempt and check if account should be locked
 * @param {string} email - User email
 * @param {string} ip - Client IP address
 * @returns {Object} - { locked: boolean, remainingAttempts: number, delayMs: number }
 */
async function trackFailedAttempt(email, ip) {
  const db = getFirestore();
  const lockKey = `lock-${email.toLowerCase()}`;
  const lockRef = db.collection('AccountLocks').doc(lockKey);

  try {
    const doc = await lockRef.get();
    const now = new Date();
    
    if (doc.exists) {
      const data = doc.data();
      const lockUntil = data.LockUntil?.toDate?.() || new Date(data.LockUntil);
      
      // Check if currently locked
      if (now < lockUntil) {
        const remainingTime = Math.ceil((lockUntil - now) / 60000);
        return {
          locked: true,
          remainingAttempts: 0,
          delayMs: 0,
          remainingTimeMinutes: remainingTime,
          message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
        };
      }
      
      // Lock expired, reset counter if window passed
      const firstAttempt = data.FirstAttempt?.toDate?.() || new Date(data.FirstAttempt);
      const windowMs = 15 * 60 * 1000; // 15 minute window
      if (now - firstAttempt > windowMs) {
        // Reset - start fresh
        await lockRef.set({
          Email: email.toLowerCase(),
          FailedAttempts: 1,
          FirstAttempt: now,
          LastAttempt: now,
          IPs: [ip],
          LockUntil: null
        });
        return {
          locked: false,
          remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
          delayMs: PROGRESSIVE_DELAY_BASE_MS
        };
      }
      
      // Within window - increment attempts
      const newAttempts = (data.FailedAttempts || 0) + 1;
      const ips = data.IPs || [];
      if (!ips.includes(ip)) ips.push(ip);
      
      // Calculate progressive delay (exponential backoff)
      const delayMs = Math.min(PROGRESSIVE_DELAY_BASE_MS * Math.pow(2, newAttempts - 1), 30000); // Max 30s
      
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock the account
        const lockUntil = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000);
        await lockRef.update({
          FailedAttempts: newAttempts,
          LastAttempt: now,
          IPs: ips,
          LockUntil: lockUntil,
          LockedAt: now
        });
        
        // Log security event
        const authService = require('../services/authService');
        await authService.logSecurityEvent(null, 'ACCOUNT_LOCKED', {
          email,
          reason: 'Too many failed attempts',
          attempts: newAttempts,
          ips: ips
        });
        
        return {
          locked: true,
          remainingAttempts: 0,
          delayMs: 0,
          remainingTimeMinutes: LOCK_DURATION_MINUTES,
          message: `Account locked due to too many failed attempts. Try again in ${LOCK_DURATION_MINUTES} minutes.`
        };
      }
      
      // Update attempts but don't lock yet
      await lockRef.update({
        FailedAttempts: newAttempts,
        LastAttempt: now,
        IPs: ips
      });
      
      return {
        locked: false,
        remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts,
        delayMs
      };
    }
    
    // First failed attempt
    await lockRef.set({
      Email: email.toLowerCase(),
      FailedAttempts: 1,
      FirstAttempt: now,
      LastAttempt: now,
      IPs: [ip],
      LockUntil: null
    });
    
    return {
      locked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - 1,
      delayMs: PROGRESSIVE_DELAY_BASE_MS
    };
  } catch (error) {
    console.error('Account lock tracking error:', error);
    // Don't block on error
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1, delayMs: PROGRESSIVE_DELAY_BASE_MS };
  }
}

/**
 * Clear failed attempts on successful login
 * @param {string} email - User email
 */
async function clearFailedAttempts(email) {
  const db = getFirestore();
  const lockKey = `lock-${email.toLowerCase()}`;
  
  try {
    await db.collection('AccountLocks').doc(lockKey).delete();
  } catch (error) {
    console.error('Error clearing failed attempts:', error);
  }
}

/**
 * Check if account is currently locked
 * @param {string} email - User email
 * @returns {Object} - { locked: boolean, remainingTimeMinutes: number }
 */
async function checkAccountLock(email) {
  const db = getFirestore();
  const lockKey = `lock-${email.toLowerCase()}`;
  const lockRef = db.collection('AccountLocks').doc(lockKey);

  try {
    const doc = await lockRef.get();
    
    if (!doc.exists) {
      return { locked: false };
    }
    
    const data = doc.data();
    const lockUntil = data.LockUntil?.toDate?.() || new Date(data.LockUntil);
    const now = new Date();
    
    if (now < lockUntil) {
      const remainingTime = Math.ceil((lockUntil - now) / 60000);
      return {
        locked: true,
        remainingTimeMinutes: remainingTime,
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
      };
    }
    
    return { locked: false };
  } catch (error) {
    console.error('Error checking account lock:', error);
    return { locked: false };
  }
}

/**
 * Middleware to check account lock before login
 */
const checkLockMiddleware = async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }
  
  const lockStatus = await checkAccountLock(email);
  
  if (lockStatus.locked) {
    return res.status(423).json({
      success: false,
      error: 'Account Locked',
      message: lockStatus.message,
      code: 423,
      remainingTimeMinutes: lockStatus.remainingTimeMinutes
    });
  }
  
  next();
};

/**
 * Per-email rate limiter using Firestore
 * Limits login attempts per email address (regardless of IP)
 */
const perEmailLimiter = async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }
  
  const db = getFirestore();
  const rateKey = `email-rate-${email.toLowerCase()}`;
  const rateRef = db.collection('RateLimits').doc(rateKey);
  
  try {
    const doc = await rateRef.get();
    const now = new Date();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10; // Max 10 attempts per email per 15 min (across all IPs)
    
    if (doc.exists) {
      const data = doc.data();
      const windowStart = data.WindowStart?.toDate?.() || new Date(data.WindowStart);
      
      // Check if window expired
      if (now - windowStart > windowMs) {
        await rateRef.set({
          Email: email.toLowerCase(),
          Attempts: 1,
          WindowStart: now,
          IPs: [req.ip]
        });
        return next();
      }
      
      const attempts = (data.Attempts || 0) + 1;
      const ips = data.IPs || [];
      if (!ips.includes(req.ip)) ips.push(req.ip);
      
      if (attempts > maxAttempts) {
        return res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: 'Too many login attempts for this email. Please try again later.',
          code: 429
        });
      }
      
      await rateRef.update({
        Attempts: attempts,
        IPs: ips
      });
      return next();
    }
    
    await rateRef.set({
      Email: email.toLowerCase(),
      Attempts: 1,
      WindowStart: now,
      IPs: [req.ip]
    });
    next();
  } catch (error) {
    console.error('Per-email rate limiter error:', error);
    next();
  }
};

module.exports = {
  trackFailedAttempt,
  clearFailedAttempts,
  checkAccountLock,
  checkLockMiddleware,
  perEmailLimiter,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES
};
