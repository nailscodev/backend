/**
 * @fileoverview Session Utilities
 * 
 * Provides consistent session ID extraction and generation utilities
 * to ensure compatibility between CSRF controller and guard.
 */

import type { Request } from 'express';

interface ExtendedRequest extends Request {
  session?: any;
  user?: any;
}

/**
 * Extracts session ID from request using a consistent algorithm
 * @param request - HTTP request object
 * @returns Session ID string
 */
export function extractSessionId(request: ExtendedRequest): string {
  // Strategy 1: Check session middleware
  const sessionId = getSessionId(request);
  if (sessionId) {
    return sessionId;
  }

  // Strategy 2: Check user context
  const userSessionId = getUserSessionId(request);
  if (userSessionId) {
    return userSessionId;
  }

  // Strategy 3: Generate from IP and User Agent (fallback)
  const ip = getClientIP(request);
  const userAgent = request.get('user-agent') || 'unknown';
  
  return `${ip}_${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;
}

/**
 * Gets session ID from session middleware
 */
function getSessionId(request: ExtendedRequest): string | null {
  try {
     
    const session = request.session;
     
    if (session && typeof session === 'object' && session.id) {
       
      return String(session.id);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Gets session ID from user context
 */
function getUserSessionId(request: ExtendedRequest): string | null {
  try {
     
    const user = request.user;
    if (user && typeof user === 'object') {
       
      if (user.sessionId) {
         
        return String(user.sessionId);
      }
       
      if (user.id) {
         
        return `user_${String(user.id)}`;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Gets client IP address from request
 */
function getClientIP(request: ExtendedRequest): string {
  try {
    // X-Forwarded-For header (proxy/load balancer)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    // X-Real-IP header
    const realIP = request.headers['x-real-ip'];
    if (typeof realIP === 'string' && realIP.length > 0) {
      return realIP;
    }

    // X-Client-IP header
    const clientIPHeader = request.headers['x-client-ip'];
    if (typeof clientIPHeader === 'string' && clientIPHeader.length > 0) {
      return clientIPHeader;
    }

    // Connection remote address
     
    const connection = (request as any).connection;
     
    if (connection && connection.remoteAddress) {
       
      return String(connection.remoteAddress);
    }

    // Socket remote address (final fallback)
    if (request.socket && request.socket.remoteAddress) {
      return request.socket.remoteAddress;
    }
  } catch {
    // Return default on error
  }

  return '127.0.0.1';
}