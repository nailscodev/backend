import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Request } from 'express';

/**
 * Security guard with IP whitelist and attack detection
 * 
 * This guard provides:
 * - IP whitelist support for development and admin IPs
 * - Enhanced logging for security monitoring
 * - Attack pattern detection and alerting
 * 
 * Note: This guard works alongside ThrottlerGuard, not as a replacement.
 * It provides additional security features and IP whitelisting.
 * 
 * @class CustomThrottlerGuard
 * @implements {CanActivate}
 */
@Injectable()
export class CustomThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(CustomThrottlerGuard.name);
  private readonly whitelistedIPs: Set<string>;

  constructor() {
    // Initialize whitelisted IPs from environment or use defaults
    const whitelistEnv = process.env.THROTTLE_WHITELIST_IPS || '';
    const defaultIPs = ['127.0.0.1', '::1', 'localhost'];
    const envIPs = whitelistEnv ? whitelistEnv.split(',').map(ip => ip.trim()) : [];
    
    this.whitelistedIPs = new Set([...defaultIPs, ...envIPs]);
    
    this.logger.log(`Security guard whitelist initialized with IPs: ${Array.from(this.whitelistedIPs).join(', ')}`);
  }

  /**
   * Determines if the request should be allowed to proceed
   * @param context - Execution context
   * @returns boolean - True if request should proceed
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientIP = this.getClientIP(request);
    
    // Always allow whitelisted IPs
    if (this.whitelistedIPs.has(clientIP)) {
      this.logger.debug(`Allowing whitelisted IP: ${clientIP}`);
      return true;
    }
    
    // Always allow health check endpoints
    if (request.url?.includes('/health')) {
      return true;
    }
    
    // Log request for security monitoring
    this.logRequest(request, clientIP);
    
    // Check for potential attack patterns
    this.detectAttackPatterns(request, clientIP);
    
    // Allow request to proceed (throttling is handled by ThrottlerGuard)
    return true;
  }

  /**
   * Logs request details for security monitoring
   * @param request - HTTP request object
   * @param clientIP - Client IP address
   */
  private logRequest(request: Request, clientIP: string): void {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const endpoint = `${request.method} ${request.url}`;
    
    this.logger.debug(`Request: ${endpoint} from IP: ${clientIP}, User-Agent: ${userAgent}`);
  }

  /**
   * Gets the real client IP address, considering proxies and load balancers
   * @param request - Express request object
   * @returns Client IP address
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    
    if (typeof forwarded === 'string') {
      // X-Forwarded-For can contain multiple IPs, use the first one
      return forwarded.split(',')[0].trim();
    }
    
    if (typeof realIP === 'string') {
      return realIP.trim();
    }
    
    return request.connection?.remoteAddress || 
           request.socket?.remoteAddress || 
           request.ip || 
           '0.0.0.0';
  }

  /**
   * Adds an IP to the whitelist at runtime
   * @param ip - IP address to whitelist
   */
  public addToWhitelist(ip: string): void {
    this.whitelistedIPs.add(ip);
    this.logger.log(`IP added to whitelist: ${ip}`);
  }

  /**
   * Removes an IP from the whitelist
   * @param ip - IP address to remove
   */
  public removeFromWhitelist(ip: string): void {
    this.whitelistedIPs.delete(ip);
    this.logger.log(`IP removed from whitelist: ${ip}`);
  }

  /**
   * Gets current whitelisted IPs
   * @returns Array of whitelisted IP addresses
   */
  public getWhitelistedIPs(): string[] {
    return Array.from(this.whitelistedIPs);
  }

  /**
   * Detects potential attack patterns and logs security alerts
   * @param request - HTTP request object
   * @param clientIP - Client IP address
   */
  private detectAttackPatterns(request: Request, clientIP: string): void {
    const userAgent = request.headers['user-agent'] || '';
    const endpoint = request.url || '';
    
    // Detect suspicious user agents
    const suspiciousUAs = [
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
      'python-requests', 'curl', 'wget'
    ];
    
    const isSuspiciousUA = suspiciousUAs.some(ua => 
      userAgent.toLowerCase().includes(ua)
    );
    
    // Detect sensitive endpoint targeting
    const sensitiveEndpoints = [
      '/customers', '/bookings', '/auth', '/admin', 
      '/users', '/login', '/register'
    ];
    
    const isSensitiveEndpoint = sensitiveEndpoints.some(ep => 
      endpoint.startsWith(ep)
    );
    
    if (isSuspiciousUA || isSensitiveEndpoint) {
      this.logger.error(`SECURITY ALERT: Potential attack detected`, {
        ip: clientIP,
        userAgent,
        endpoint,
        reasons: {
          suspiciousUserAgent: isSuspiciousUA,
          sensitiveEndpoint: isSensitiveEndpoint,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}