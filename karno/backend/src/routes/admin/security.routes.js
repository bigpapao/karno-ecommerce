/**
 * Security Routes for Admin
 *
 * These routes provide security monitoring and management capabilities
 * for administrators.
 */

import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import {
  getSecurityEvents,
  getSuspiciousIPs,
  blockIP,
  unblockIP,
  clearSuspiciousIPs,
} from '../../middleware/security-monitor.middleware.js';
import { logger } from '../../utils/logger.js';
import { ApiError, ErrorCodes } from '../../utils/api-error.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();

// Apply auth middleware to all security routes
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/security/events
 * @desc    Get recent security events
 * @access  Private/Admin
 */
router.get('/events', asyncHandler(async (req, res, next) => {
  const { limit = 100 } = req.query;
  const events = getSecurityEvents(parseInt(limit, 10));

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: events,
  });
}));

/**
 * @route   GET /api/admin/security/suspicious-ips
 * @desc    Get list of suspicious IP addresses
 * @access  Private/Admin
 */
router.get('/suspicious-ips', asyncHandler(async (req, res, next) => {
  const ips = getSuspiciousIPs();

  res.status(200).json({
    status: 'success',
    results: ips.length,
    data: ips,
  });
}));

/**
 * @route   POST /api/admin/security/block-ip
 * @desc    Block an IP address
 * @access  Private/Admin
 */
router.post('/block-ip', asyncHandler(async (req, res, next) => {
  const { ip } = req.body;

  if (!ip) {
    return next(new ApiError(400, 'IP address is required', ErrorCodes.BAD_REQUEST));
  }

  blockIP(ip);

  logger.info({
    message: 'IP address blocked by admin',
    ip,
    adminId: req.user._id,
  });

  res.status(200).json({
    status: 'success',
    message: `IP address ${ip} has been blocked`,
  });
}));

/**
 * @route   POST /api/admin/security/unblock-ip
 * @desc    Unblock an IP address
 * @access  Private/Admin
 */
router.post('/unblock-ip', asyncHandler(async (req, res, next) => {
  const { ip } = req.body;

  if (!ip) {
    return next(new ApiError(400, 'IP address is required', ErrorCodes.BAD_REQUEST));
  }

  unblockIP(ip);

  logger.info({
    message: 'IP address unblocked by admin',
    ip,
    adminId: req.user._id,
  });

  res.status(200).json({
    status: 'success',
    message: `IP address ${ip} has been unblocked`,
  });
}));

/**
 * @route   POST /api/admin/security/clear-suspicious
 * @desc    Clear the list of suspicious IP addresses
 * @access  Private/Admin
 */
router.post('/clear-suspicious', asyncHandler(async (req, res, next) => {
  clearSuspiciousIPs();

  logger.info({
    message: 'Suspicious IP list cleared by admin',
    adminId: req.user._id,
  });

  res.status(200).json({
    status: 'success',
    message: 'Suspicious IP list has been cleared',
  });
}));

/**
 * @route   GET /api/admin/security/test-csrf
 * @desc    Generate a form for testing CSRF protection
 * @access  Private/Admin
 */
router.get('/test-csrf', asyncHandler(async (req, res, next) => {
  // HTML response with a form for CSRF testing
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CSRF Protection Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .test-section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; }
        button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>CSRF Protection Test</h1>
      
      <div class="test-section">
        <h2>Test with Valid CSRF Token</h2>
        <p>This request should succeed because it includes the valid CSRF token from the cookie.</p>
        <button id="validTest">Run Test</button>
        <div id="validResult"></div>
      </div>
      
      <div class="test-section">
        <h2>Test without CSRF Token</h2>
        <p>This request should fail because it doesn't include the CSRF token.</p>
        <button id="invalidTest">Run Test</button>
        <div id="invalidResult"></div>
      </div>
      
      <script>
        document.getElementById('validTest').addEventListener('click', async () => {
          const result = document.getElementById('validResult');
          try {
            // Get the CSRF token from cookie
            const csrfToken = document.cookie
              .split('; ')
              .find(row => row.startsWith('XSRF-TOKEN='))
              ?.split('=')[1];
              
            if (!csrfToken) {
              throw new Error('CSRF token not found in cookies');
            }
            
            // Make request with the token
            const response = await fetch('/api/admin/security/test-csrf-endpoint', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken
              },
              body: JSON.stringify({ test: 'data' })
            });
            
            const data = await response.json();
            result.innerHTML = '<p class="success">Request succeeded</p><pre>' + 
              JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            result.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        });
        
        document.getElementById('invalidTest').addEventListener('click', async () => {
          const result = document.getElementById('invalidResult');
          try {
            // Make request without the token
            const response = await fetch('/api/admin/security/test-csrf-endpoint', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ test: 'data' })
            });
            
            if (response.ok) {
              const data = await response.json();
              result.innerHTML = '<p class="error">Request succeeded (it should have failed)</p><pre>' + 
                JSON.stringify(data, null, 2) + '</pre>';
            } else {
              const data = await response.json();
              result.innerHTML = '<p class="success">Request correctly failed with:</p><pre>' + 
                JSON.stringify(data, null, 2) + '</pre>';
            }
          } catch (error) {
            result.innerHTML = '<p class="success">Error (as expected): ' + error.message + '</p>';
          }
        });
      </script>
    </body>
    </html>
  `);
}));

/**
 * @route   POST /api/admin/security/test-csrf-endpoint
 * @desc    Endpoint for testing CSRF protection
 * @access  Private/Admin
 */
router.post('/test-csrf-endpoint', asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'CSRF test endpoint accessed successfully',
    receivedData: req.body,
  });
}));

/**
 * @route   GET /api/admin/security/test-xss
 * @desc    Test XSS protection
 * @access  Private/Admin
 */
router.get('/test-xss', asyncHandler(async (req, res, next) => {
  const { input } = req.query;

  // Build the HTML response without template literals to avoid syntax issues
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>XSS Protection Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .test-section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; }
        input { width: 80%; padding: 8px; }
        button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        .output { background: #f5f5f5; padding: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>XSS Protection Test</h1>
      
      <div class="test-section">
        <h2>Test XSS Protection</h2>
        <p>Enter a string with potential XSS payload (e.g. &lt;script&gt;alert('xss')&lt;/script&gt;)</p>
        <form method="GET" action="/api/admin/security/test-xss">
          <input type="text" name="input" value="${input || ''}" placeholder="Enter test string">
          <button type="submit">Test</button>
        </form>`;

  // Conditionally add output section
  if (input) {
    html += `
        <h3>Output (should be sanitized):</h3>
        <div class="output">${input}</div>`;
  }

  // Close the first section and add the rest
  html += `
      </div>
      
      <div class="test-section">
        <h2>Common XSS Test Patterns</h2>
        <ul>
          <li><code>&lt;script&gt;alert('xss')&lt;/script&gt;</code></li>
          <li><code>&lt;img src="x" onerror="alert('xss')"&gt;</code></li>
          <li><code>&lt;a href="javascript:alert('xss')"&gt;Click me&lt;/a&gt;</code></li>
          <li><code>&lt;div onmouseover="alert('xss')"&gt;Hover over me&lt;/div&gt;</code></li>
        </ul>
      </div>
    </body>
    </html>`;

  res.send(html);
}));

/**
 * @route   GET /api/admin/security/headers
 * @desc    Test security headers
 * @access  Private/Admin
 */
router.get('/headers', asyncHandler(async (req, res, next) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Headers Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .test-section { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .good { color: green; }
        .bad { color: red; }
        .warning { color: orange; }
      </style>
    </head>
    <body>
      <h1>Security Headers Test</h1>
      
      <div class="test-section">
        <h2>Current Security Headers</h2>
        <p>This page shows the security headers sent by the server. Check the browser console for CSP violations.</p>
        
        <table id="headersTable">
          <tr>
            <th>Header</th>
            <th>Value</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Content-Security-Policy</td>
            <td id="csp-value">Checking...</td>
            <td id="csp-status">Checking...</td>
          </tr>
          <tr>
            <td>X-XSS-Protection</td>
            <td id="xss-value">Checking...</td>
            <td id="xss-status">Checking...</td>
          </tr>
          <tr>
            <td>X-Content-Type-Options</td>
            <td id="cto-value">Checking...</td>
            <td id="cto-status">Checking...</td>
          </tr>
          <tr>
            <td>X-Frame-Options</td>
            <td id="xfo-value">Checking...</td>
            <td id="xfo-status">Checking...</td>
          </tr>
          <tr>
            <td>Strict-Transport-Security</td>
            <td id="hsts-value">Checking...</td>
            <td id="hsts-status">Checking...</td>
          </tr>
          <tr>
            <td>Referrer-Policy</td>
            <td id="rp-value">Checking...</td>
            <td id="rp-status">Checking...</td>
          </tr>
          <tr>
            <td>Permissions-Policy</td>
            <td id="pp-value">Checking...</td>
            <td id="pp-status">Checking...</td>
          </tr>
        </table>
      </div>
      
      <script>
        // Fetch the current page to check headers
        fetch(window.location.href)
          .then(response => {
            const headers = response.headers;
            
            // Check CSP
            checkHeader('csp', 'content-security-policy', headers, value => !!value);
            
            // Check XSS Protection
            checkHeader('xss', 'x-xss-protection', headers, value => value === '1; mode=block');
            
            // Check Content Type Options
            checkHeader('cto', 'x-content-type-options', headers, value => value === 'nosniff');
            
            // Check Frame Options
            checkHeader('xfo', 'x-frame-options', headers, value => value === 'DENY' || value === 'SAMEORIGIN');
            
            // Check HSTS
            checkHeader('hsts', 'strict-transport-security', headers, value => value && value.includes('max-age='));
            
            // Check Referrer Policy
            checkHeader('rp', 'referrer-policy', headers, value => !!value);
            
            // Check Permissions Policy
            checkHeader('pp', 'permissions-policy', headers, value => !!value);
          })
          .catch(error => {
            console.error('Error checking headers:', error);
          });
          
        function checkHeader(id, headerName, headers, validationFn) {
          const value = headers.get(headerName) || 'Not set';
          document.getElementById(\`\${id}-value\`).textContent = value;
          
          let statusClass = 'bad';
          let statusText = 'Missing';
          
          if (value !== 'Not set') {
            if (validationFn(value)) {
              statusClass = 'good';
              statusText = 'Good';
            } else {
              statusClass = 'warning';
              statusText = 'Suboptimal';
            }
          }
          
          const statusCell = document.getElementById(\`\${id}-status\`);
          statusCell.textContent = statusText;
          statusCell.className = statusClass;
        }
      </script>
    </body>
    </html>
  `);
}));

export default router;
