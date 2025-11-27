/**
 * Xero OAuth Routes
 *
 * Handles Xero OAuth 2.0 authorization flow
 * Replaces: Auth Lambda (functions/auth/) + oauth-server package
 */

import { Router } from 'express';
import type { DatabaseProvider, OAuthTokens } from '@zero-agent/core';
import crypto from 'crypto';

interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface XeroTenant {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}

// Xero OAuth configuration
const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

const SCOPES = [
  'offline_access',
  'accounting.transactions',
  'accounting.contacts',
  'accounting.settings',
  'accounting.reports.read',
].join(' ');

export function createAuthRoutes(db: DatabaseProvider): Router {
  const router = Router();

  const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
  const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
  const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  const REDIRECT_URI = `${BASE_URL}/auth/callback`;
  const FRONTEND_URL = process.env.FRONTEND_URL || BASE_URL;

  /**
   * GET /auth/xero
   * Initiate OAuth flow - redirect to Xero
   */
  router.get('/xero', (req, res) => {
    if (!XERO_CLIENT_ID) {
      return res.status(500).json({
        error: 'Xero OAuth not configured. Set XERO_CLIENT_ID and XERO_CLIENT_SECRET.',
      });
    }

    const state = crypto.randomUUID(); // CSRF protection
    // TODO: Store state in session for validation

    const authUrl = new URL(XERO_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', XERO_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    console.log(`🔐 Redirecting to Xero authorization...`);
    console.log(`   Redirect URI: ${REDIRECT_URI}`);

    res.redirect(authUrl.toString());
  });

  /**
   * GET /auth/callback
   * Handle OAuth callback from Xero
   */
  router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error(`❌ OAuth error: ${error}`);
      return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(String(error))}`);
    }

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Xero OAuth not configured' });
    }

    try {
      console.log(`🔄 Exchanging authorization code for tokens...`);

      // Exchange code for tokens
      const tokenResponse = await fetch(XERO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as XeroTokenResponse;
      console.log(`✅ Tokens received`);

      // Get tenant (organization) information
      const connectionsResponse = await fetch(XERO_CONNECTIONS_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const connections = await connectionsResponse.json() as XeroTenant[];
      const tenant = connections[0]; // Use first connected organization

      console.log(`✅ Connected to tenant: ${tenant?.tenantName || 'Unknown'}`);

      // Save tokens to database
      // TODO: Get userId from session/auth
      const userId = 'default-user';
      const tokens: OAuthTokens = {
        userId,
        provider: 'xero',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scopes: tokenData.scope.split(' '),
        tenantId: tenant?.tenantId,
        tenantName: tenant?.tenantName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.saveOAuthTokens(tokens);
      console.log(`✅ Tokens saved to database`);

      // Redirect to frontend with success
      res.redirect(`${FRONTEND_URL}?auth=success&org=${encodeURIComponent(tenant?.tenantName || 'Connected')}`);

    } catch (error: any) {
      console.error(`❌ OAuth callback error:`, error);
      res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error.message)}`);
    }
  });

  /**
   * POST /auth/refresh
   * Manually refresh access token
   */
  router.post('/refresh', async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'default-user';
      const tokens = await db.getOAuthTokens(userId, 'xero');

      if (!tokens) {
        return res.status(401).json({ error: 'No Xero tokens found' });
      }

      if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Xero OAuth not configured' });
      }

      const tokenResponse = await fetch(XERO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token refresh failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as XeroTokenResponse;

      const updatedTokens: OAuthTokens = {
        ...tokens,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        updatedAt: Date.now(),
      };

      await db.saveOAuthTokens(updatedTokens);

      res.json({
        success: true,
        expiresAt: updatedTokens.expiresAt,
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /auth/status
   * Check Xero authentication status
   */
  router.get('/status', async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'default-user';
      const tokens = await db.getOAuthTokens(userId, 'xero');

      if (!tokens) {
        return res.json({
          connected: false,
        });
      }

      const isExpired = tokens.expiresAt < Date.now();

      res.json({
        connected: true,
        expired: isExpired,
        tenantName: tokens.tenantName,
        tenantId: tokens.tenantId,
        expiresAt: tokens.expiresAt,
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /auth/disconnect
   * Disconnect Xero account
   */
  router.delete('/disconnect', async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'default-user';
      await db.deleteOAuthTokens(userId, 'xero');

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
