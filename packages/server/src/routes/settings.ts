/**
 * User Settings Routes
 *
 * Handles safety settings and user preferences
 */

import { Router } from 'express';
import type { DatabaseProvider, PermissionLevel, PersonalityId, ResponseStyleId, ConnectorType } from '@pip/core';
import { personalities, responseStyles, getStyleOptions, CONNECTOR_PERMISSION_NAMES } from '@pip/core';

import { requireAuth } from '../middleware/auth.js';

const VALID_CONNECTORS: ConnectorType[] = ['xero', 'gmail', 'google_sheets'];

export function createSettingsRoutes(db: DatabaseProvider): Router {
  const router = Router();

  /**
   * GET /api/styles
   * Get available response style options
   */
  router.get('/styles', requireAuth, (_req, res) => {
    const options = getStyleOptions();
    res.json({ styles: options });
  });

  /**
   * GET /api/personalities
   * Get available personality options (deferred feature)
   */
  router.get('/personalities', requireAuth, (_req, res) => {
    const options = Object.entries(personalities).map(([id, p]) => ({
      id,
      name: p.name,
      description: p.description,
      greeting: p.speech.greetings[0],
    }));
    res.json({ personalities: options });
  });

  /**
   * GET /api/settings
   * Get current user settings
   */
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      let settings = await db.getUserSettings(req.userId!);

      // Create default settings if none exist
      if (!settings) {
        settings = await db.upsertUserSettings({
          userId: req.userId!,
          permissionLevel: 0,
          responseStyle: 'normal',
          requireConfirmation: true,
          dailyEmailSummary: true,
          require2FA: false,
          personality: 'adelaide',
        });
      }

      // Get style info
      const styleId = settings.responseStyle || 'normal';
      const style = responseStyles[styleId as ResponseStyleId];

      // Get personality info (deferred feature)
      const personalityId = settings.personality || 'adelaide';
      const personality = personalities[personalityId as PersonalityId];

      res.json({
        settings: {
          permissionLevel: settings.permissionLevel,
          responseStyle: styleId,
          requireConfirmation: settings.requireConfirmation,
          dailyEmailSummary: settings.dailyEmailSummary,
          require2FA: settings.require2FA,
          vacationModeUntil: settings.vacationModeUntil,
          personality: personalityId,
        },
        styleInfo: {
          name: style.name,
          description: style.description,
        },
        personalityInfo: {
          name: personality.name,
          description: personality.description,
          greeting: personality.speech.greetings[0],
          role: personality.identity.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/settings
   * Update user settings
   */
  router.put('/', requireAuth, async (req, res, next) => {
    try {
      const {
        permissionLevel,
        responseStyle,
        requireConfirmation,
        dailyEmailSummary,
        require2FA,
        vacationModeUntil,
        personality,
      } = req.body;

      // Validate permission level
      if (permissionLevel !== undefined) {
        if (![0, 1, 2, 3].includes(permissionLevel)) {
          return res.status(400).json({
            error: 'Invalid permission level. Must be 0, 1, 2, or 3.',
          });
        }
      }

      // Validate response style
      if (responseStyle !== undefined) {
        if (!Object.keys(responseStyles).includes(responseStyle)) {
          return res.status(400).json({
            error: `Invalid response style. Must be one of: ${Object.keys(responseStyles).join(', ')}`,
          });
        }
      }

      // Validate vacation mode date
      if (vacationModeUntil !== undefined && vacationModeUntil !== null) {
        if (typeof vacationModeUntil !== 'number' || vacationModeUntil < Date.now()) {
          return res.status(400).json({
            error: 'Vacation mode date must be in the future.',
          });
        }
      }

      // Validate personality (deferred feature)
      if (personality !== undefined) {
        if (!Object.keys(personalities).includes(personality)) {
          return res.status(400).json({
            error: `Invalid personality. Must be one of: ${Object.keys(personalities).join(', ')}`,
          });
        }
      }

      const settings = await db.upsertUserSettings({
        userId: req.userId!,
        ...(permissionLevel !== undefined && { permissionLevel: permissionLevel as PermissionLevel }),
        ...(responseStyle !== undefined && { responseStyle: responseStyle as ResponseStyleId }),
        ...(requireConfirmation !== undefined && { requireConfirmation }),
        ...(dailyEmailSummary !== undefined && { dailyEmailSummary }),
        ...(require2FA !== undefined && { require2FA }),
        ...(vacationModeUntil !== undefined && { vacationModeUntil: vacationModeUntil || undefined }),
        ...(personality !== undefined && { personality: personality as PersonalityId }),
      });

      console.log(`✅ Settings updated for user ${req.userId}: level=${settings.permissionLevel}, style=${settings.responseStyle}`);

      // Get style info
      const styleId = settings.responseStyle || 'normal';
      const style = responseStyles[styleId as ResponseStyleId];

      // Get personality info (deferred feature)
      const personalityId = settings.personality || 'adelaide';
      const personalityData = personalities[personalityId as PersonalityId];

      res.json({
        settings: {
          permissionLevel: settings.permissionLevel,
          responseStyle: styleId,
          requireConfirmation: settings.requireConfirmation,
          dailyEmailSummary: settings.dailyEmailSummary,
          require2FA: settings.require2FA,
          vacationModeUntil: settings.vacationModeUntil,
          personality: personalityId,
        },
        styleInfo: {
          name: style.name,
          description: style.description,
        },
        personalityInfo: {
          name: personalityData.name,
          description: personalityData.description,
          greeting: personalityData.speech.greetings[0],
          role: personalityData.identity.role,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Connector Permission Routes
  // ==========================================================================

  /**
   * GET /api/settings/connectors
   * Get all connector permissions for the user
   */
  router.get('/connectors', requireAuth, async (req, res, next) => {
    try {
      const permissions = await db.listConnectorPermissions(req.userId!);

      // Build response with all connectors (use defaults for missing ones)
      const connectorPermissions: Record<ConnectorType, {
        permissionLevel: PermissionLevel;
        levelName: string;
        updatedAt?: number;
      }> = {
        xero: { permissionLevel: 0, levelName: CONNECTOR_PERMISSION_NAMES.xero[0] },
        gmail: { permissionLevel: 0, levelName: CONNECTOR_PERMISSION_NAMES.gmail[0] },
        google_sheets: { permissionLevel: 0, levelName: CONNECTOR_PERMISSION_NAMES.google_sheets[0] },
      };

      // Override with actual permissions
      for (const perm of permissions) {
        connectorPermissions[perm.connector] = {
          permissionLevel: perm.permissionLevel,
          levelName: CONNECTOR_PERMISSION_NAMES[perm.connector][perm.permissionLevel],
          updatedAt: perm.updatedAt,
        };
      }

      res.json({
        connectorPermissions,
        availableLevels: CONNECTOR_PERMISSION_NAMES,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/settings/connectors/:connector
   * Get permission for a specific connector
   */
  router.get('/connectors/:connector', requireAuth, async (req, res, next) => {
    try {
      const connector = req.params.connector as ConnectorType;

      if (!VALID_CONNECTORS.includes(connector)) {
        return res.status(400).json({
          error: `Invalid connector. Must be one of: ${VALID_CONNECTORS.join(', ')}`,
        });
      }

      const permission = await db.getConnectorPermission(req.userId!, connector);

      // Default to read-only if no permission set
      const permissionLevel = permission?.permissionLevel ?? 0;

      res.json({
        connector,
        permissionLevel,
        levelName: CONNECTOR_PERMISSION_NAMES[connector][permissionLevel as PermissionLevel],
        availableLevels: CONNECTOR_PERMISSION_NAMES[connector],
        updatedAt: permission?.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /api/settings/connectors/:connector
   * Update permission for a specific connector
   */
  router.put('/connectors/:connector', requireAuth, async (req, res, next) => {
    try {
      const connector = req.params.connector as ConnectorType;
      const { permissionLevel } = req.body;

      if (!VALID_CONNECTORS.includes(connector)) {
        return res.status(400).json({
          error: `Invalid connector. Must be one of: ${VALID_CONNECTORS.join(', ')}`,
        });
      }

      if (permissionLevel === undefined || ![0, 1, 2, 3].includes(permissionLevel)) {
        return res.status(400).json({
          error: 'Invalid permission level. Must be 0, 1, 2, or 3.',
        });
      }

      // Validate level is meaningful for this connector
      const levelName = CONNECTOR_PERMISSION_NAMES[connector][permissionLevel as PermissionLevel];

      const permission = await db.upsertConnectorPermission(
        req.userId!,
        connector,
        permissionLevel as PermissionLevel
      );

      console.log(`✅ Connector permission updated: user=${req.userId}, connector=${connector}, level=${permissionLevel} (${levelName})`);

      res.json({
        connector,
        permissionLevel: permission.permissionLevel,
        levelName,
        availableLevels: CONNECTOR_PERMISSION_NAMES[connector],
        updatedAt: permission.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/settings/connectors/:connector
   * Reset connector permission to default (read-only)
   */
  router.delete('/connectors/:connector', requireAuth, async (req, res, next) => {
    try {
      const connector = req.params.connector as ConnectorType;

      if (!VALID_CONNECTORS.includes(connector)) {
        return res.status(400).json({
          error: `Invalid connector. Must be one of: ${VALID_CONNECTORS.join(', ')}`,
        });
      }

      await db.deleteConnectorPermission(req.userId!, connector);

      console.log(`✅ Connector permission reset to default: user=${req.userId}, connector=${connector}`);

      res.json({
        connector,
        permissionLevel: 0,
        levelName: CONNECTOR_PERMISSION_NAMES[connector][0],
        message: 'Permission reset to read-only (default)',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
