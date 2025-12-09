/**
 * Safety Service for MCP Remote Server
 *
 * Implements tiered permission model with per-connector granularity.
 * See specs/SAFETY-ARCHITECTURE.md for full design.
 *
 * Permission Levels:
 * - Level 0: Read-only (default) - get_*, search_*, read_* tools
 * - Level 1: Create/Write - create_*, write_*, append_*
 * - Level 2: Update/Delete - approve_*, update_*, delete_*
 * - Level 3: Destructive - void_*, permanent_delete_* (Xero only)
 *
 * Per-Connector Permissions:
 * - Each connector (xero, gmail, google_sheets) has its own permission level
 * - Users can grant read-only to Xero but write access to Sheets
 * - Default is Level 0 (read-only) for all connectors
 */

import {
  type PermissionLevel,
  type UserSettings,
  type ConnectorType,
  type ConnectorPermission,
  PERMISSION_LEVEL_NAMES,
  CONNECTOR_PERMISSION_NAMES,
} from "@pip/core";
import { getDb } from "./xero.js";

/**
 * Tool to connector mapping
 * Determines which connector a tool belongs to for permission checking
 */
export const TOOL_CONNECTOR_MAP: Record<string, ConnectorType> = {
  // Xero tools
  get_invoices: "xero",
  get_aged_receivables: "xero",
  get_aged_payables: "xero",
  get_profit_and_loss: "xero",
  get_balance_sheet: "xero",
  get_bank_accounts: "xero",
  get_bank_transactions: "xero",
  get_contacts: "xero",
  search_contacts: "xero",
  get_organisation: "xero",
  list_accounts: "xero",
  create_invoice_draft: "xero",
  create_contact: "xero",
  create_credit_note_draft: "xero",
  approve_invoice: "xero",
  update_invoice: "xero",
  update_contact: "xero",
  record_payment: "xero",
  void_invoice: "xero",
  delete_draft_invoice: "xero",
  delete_contact: "xero",

  // Gmail tools
  search_gmail: "gmail",
  get_email_content: "gmail",
  download_attachment: "gmail",
  list_email_attachments: "gmail",

  // Google Sheets tools
  read_sheet_range: "google_sheets",
  get_sheet_metadata: "google_sheets",
  search_spreadsheets: "google_sheets",
  list_sheets: "google_sheets",
  get_spreadsheet_revisions: "google_sheets",
  write_sheet_range: "google_sheets",
  append_sheet_rows: "google_sheets",
  update_cell: "google_sheets",
  create_spreadsheet: "google_sheets",
  add_sheet: "google_sheets",
  clear_range: "google_sheets",
  delete_sheet: "google_sheets",
  delete_rows: "google_sheets",
  delete_columns: "google_sheets",
  trash_spreadsheet: "google_sheets",
};

/**
 * Tool permission requirements
 * Maps tool names to minimum required permission level
 */
export const TOOL_PERMISSION_LEVELS: Record<string, PermissionLevel> = {
  // ==========================================================================
  // Xero Tools
  // ==========================================================================

  // Level 0: Read-only
  get_invoices: 0,
  get_aged_receivables: 0,
  get_aged_payables: 0,
  get_profit_and_loss: 0,
  get_balance_sheet: 0,
  get_bank_accounts: 0,
  get_bank_transactions: 0,
  get_contacts: 0,
  search_contacts: 0,
  get_organisation: 0,
  list_accounts: 0,

  // Level 1: Create drafts
  create_invoice_draft: 1,
  create_contact: 1,
  create_credit_note_draft: 1,

  // Level 2: Approve/Update
  approve_invoice: 2,
  update_invoice: 2,
  update_contact: 2,
  record_payment: 2,

  // Level 3: Delete/Void (IRREVERSIBLE in Xero)
  void_invoice: 3,
  delete_draft_invoice: 3,
  delete_contact: 3,

  // ==========================================================================
  // Gmail Tools (read-only for now)
  // ==========================================================================

  search_gmail: 0,
  get_email_content: 0,
  download_attachment: 0,
  list_email_attachments: 0,

  // ==========================================================================
  // Google Sheets Tools
  // ==========================================================================

  // Level 0: Read-only
  read_sheet_range: 0,
  get_sheet_metadata: 0,
  search_spreadsheets: 0,
  list_sheets: 0,
  get_spreadsheet_revisions: 0,

  // Level 1: Write/Create (reversible via version history)
  write_sheet_range: 1,
  append_sheet_rows: 1,
  update_cell: 1,
  create_spreadsheet: 1,
  add_sheet: 1,
  clear_range: 1,

  // Level 2: Delete (recoverable via trash/version history)
  delete_sheet: 2,
  delete_rows: 2,
  delete_columns: 2,
  trash_spreadsheet: 2,

  // NOTE: Level 3 not exposed for Google Sheets (no permanent_delete tools)
};

/**
 * Tool categories for display purposes
 */
export const TOOL_CATEGORIES: Record<string, string> = {
  // Xero
  get_invoices: "invoices",
  get_aged_receivables: "invoices",
  get_aged_payables: "invoices",
  get_profit_and_loss: "reports",
  get_balance_sheet: "reports",
  get_bank_accounts: "banking",
  get_bank_transactions: "banking",
  get_contacts: "contacts",
  search_contacts: "contacts",
  get_organisation: "organisation",
  list_accounts: "accounts",
  create_invoice_draft: "invoices",
  create_contact: "contacts",
  create_credit_note_draft: "invoices",
  approve_invoice: "invoices",
  update_invoice: "invoices",
  update_contact: "contacts",
  record_payment: "payments",
  void_invoice: "invoices",
  delete_draft_invoice: "invoices",
  delete_contact: "contacts",

  // Gmail
  search_gmail: "gmail",
  get_email_content: "gmail",
  download_attachment: "gmail",
  list_email_attachments: "gmail",

  // Google Sheets
  read_sheet_range: "sheets",
  get_sheet_metadata: "sheets",
  search_spreadsheets: "sheets",
  list_sheets: "sheets",
  get_spreadsheet_revisions: "sheets",
  write_sheet_range: "sheets",
  append_sheet_rows: "sheets",
  update_cell: "sheets",
  create_spreadsheet: "sheets",
  add_sheet: "sheets",
  clear_range: "sheets",
  delete_sheet: "sheets",
  delete_rows: "sheets",
  delete_columns: "sheets",
  trash_spreadsheet: "sheets",
};

/**
 * Entity types for snapshots
 */
export const TOOL_ENTITY_TYPES: Record<string, string> = {
  // Xero
  create_invoice_draft: "invoice",
  create_contact: "contact",
  create_credit_note_draft: "credit_note",
  approve_invoice: "invoice",
  update_invoice: "invoice",
  update_contact: "contact",
  record_payment: "payment",
  void_invoice: "invoice",
  delete_draft_invoice: "invoice",
  delete_contact: "contact",

  // Google Sheets
  write_sheet_range: "spreadsheet",
  append_sheet_rows: "spreadsheet",
  update_cell: "spreadsheet",
  create_spreadsheet: "spreadsheet",
  add_sheet: "sheet",
  clear_range: "spreadsheet",
  delete_sheet: "sheet",
  delete_rows: "spreadsheet",
  delete_columns: "spreadsheet",
  trash_spreadsheet: "spreadsheet",
};

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: PermissionLevel;
  currentLevel?: PermissionLevel;
  connector?: ConnectorType;
  isVacationMode?: boolean;
}

/**
 * Get user settings, or create default settings if none exist
 */
export async function getUserSettingsOrDefault(userId: string): Promise<UserSettings> {
  const db = await getDb();
  const settings = await db.getUserSettings(userId);

  if (settings) {
    return settings;
  }

  // Create default settings (read-only)
  return db.upsertUserSettings({
    userId,
    permissionLevel: 0,
    requireConfirmation: true,
    dailyEmailSummary: true,
    require2FA: false,
  });
}

/**
 * Get permission level for a specific connector
 * Returns the connector-specific permission, or defaults to global user setting
 */
export async function getConnectorPermissionLevel(
  userId: string,
  connector: ConnectorType
): Promise<PermissionLevel> {
  const db = await getDb();

  // First check for connector-specific permission
  const connectorPerm = await db.getConnectorPermission(userId, connector);
  if (connectorPerm) {
    return connectorPerm.permissionLevel;
  }

  // Fall back to global user settings (for backwards compatibility)
  const settings = await getUserSettingsOrDefault(userId);
  return settings.permissionLevel;
}

/**
 * Get or create connector permission with default read-only level
 */
export async function getConnectorPermissionOrDefault(
  userId: string,
  connector: ConnectorType
): Promise<ConnectorPermission> {
  const db = await getDb();

  const existing = await db.getConnectorPermission(userId, connector);
  if (existing) {
    return existing;
  }

  // Create default permission (read-only)
  return db.upsertConnectorPermission(userId, connector, 0);
}

/**
 * Check if a user has permission to execute a tool
 * Uses per-connector permissions when available
 */
export async function checkToolPermission(
  userId: string,
  toolName: string
): Promise<PermissionCheckResult> {
  const requiredLevel = TOOL_PERMISSION_LEVELS[toolName];

  // Unknown tool - allow by default (meta-tools, memory tools)
  if (requiredLevel === undefined) {
    return { allowed: true };
  }

  // Get the connector for this tool
  const connector = TOOL_CONNECTOR_MAP[toolName];
  if (!connector) {
    // Unknown connector - use global settings
    const settings = await getUserSettingsOrDefault(userId);
    return checkPermissionLevel(settings.permissionLevel, requiredLevel, userId);
  }

  // Get connector-specific permission level
  const currentLevel = await getConnectorPermissionLevel(userId, connector);

  // Check vacation mode (applies globally)
  const settings = await getUserSettingsOrDefault(userId);
  if (settings.vacationModeUntil && settings.vacationModeUntil > Date.now()) {
    if (requiredLevel > 0) {
      const vacationEnd = new Date(settings.vacationModeUntil).toLocaleDateString("en-AU");
      return {
        allowed: false,
        reason: `Vacation mode is active until ${vacationEnd}. Only read-only operations are allowed.`,
        requiredLevel,
        currentLevel: 0,
        connector,
        isVacationMode: true,
      };
    }
  }

  // Check permission level
  if (currentLevel < requiredLevel) {
    const connectorName = connector.replace("_", " ");
    const levelNames = CONNECTOR_PERMISSION_NAMES[connector];

    return {
      allowed: false,
      reason: `This ${connectorName} operation requires "${levelNames[requiredLevel]}" permission. ` +
        `Your current ${connectorName} level is "${levelNames[currentLevel]}". ` +
        `Enable higher permissions in Pip settings if you want to allow this.`,
      requiredLevel,
      currentLevel,
      connector,
    };
  }

  return {
    allowed: true,
    currentLevel,
    connector,
  };
}

/**
 * Helper function to check permission level
 */
async function checkPermissionLevel(
  currentLevel: PermissionLevel,
  requiredLevel: PermissionLevel,
  userId: string
): Promise<PermissionCheckResult> {
  const settings = await getUserSettingsOrDefault(userId);

  // Check vacation mode
  if (settings.vacationModeUntil && settings.vacationModeUntil > Date.now()) {
    if (requiredLevel > 0) {
      const vacationEnd = new Date(settings.vacationModeUntil).toLocaleDateString("en-AU");
      return {
        allowed: false,
        reason: `Vacation mode is active until ${vacationEnd}. Only read-only operations are allowed.`,
        requiredLevel,
        currentLevel: 0,
        isVacationMode: true,
      };
    }
  }

  if (currentLevel < requiredLevel) {
    return {
      allowed: false,
      reason: `This operation requires "${PERMISSION_LEVEL_NAMES[requiredLevel]}" permission. ` +
        `Your current level is "${PERMISSION_LEVEL_NAMES[currentLevel]}". ` +
        `Enable higher permissions in Pip settings if you want to allow this.`,
      requiredLevel,
      currentLevel,
    };
  }

  return {
    allowed: true,
    currentLevel,
  };
}

/**
 * Check if a tool is a write operation (Level 1+)
 */
export function isWriteOperation(toolName: string): boolean {
  const level = TOOL_PERMISSION_LEVELS[toolName];
  return level !== undefined && level > 0;
}

/**
 * Check if a tool requires confirmation (Level 2+)
 */
export function requiresConfirmation(toolName: string): boolean {
  const level = TOOL_PERMISSION_LEVELS[toolName];
  return level !== undefined && level >= 2;
}

/**
 * Check if a tool is destructive (Level 3)
 */
export function isDestructiveOperation(toolName: string): boolean {
  const level = TOOL_PERMISSION_LEVELS[toolName];
  return level !== undefined && level >= 3;
}

/**
 * Get tools visible to a user based on their connector permission levels
 * This is used to filter the tool list shown to the agent
 */
export async function getVisibleTools(
  userId: string,
  allTools: string[]
): Promise<string[]> {
  const settings = await getUserSettingsOrDefault(userId);
  const isVacationMode = settings.vacationModeUntil && settings.vacationModeUntil > Date.now();

  // Cache connector permissions to avoid repeated DB calls
  const connectorLevels: Partial<Record<ConnectorType, PermissionLevel>> = {};

  const visibleTools: string[] = [];

  for (const toolName of allTools) {
    const requiredLevel = TOOL_PERMISSION_LEVELS[toolName];

    // Allow unknown tools (meta-tools, memory tools)
    if (requiredLevel === undefined) {
      visibleTools.push(toolName);
      continue;
    }

    // If vacation mode is active, only allow read-only tools
    if (isVacationMode && requiredLevel > 0) {
      continue;
    }

    // Get connector for this tool
    const connector = TOOL_CONNECTOR_MAP[toolName];
    if (!connector) {
      // Unknown connector - use global settings
      if (settings.permissionLevel >= requiredLevel) {
        visibleTools.push(toolName);
      }
      continue;
    }

    // Get or cache connector permission level
    if (connectorLevels[connector] === undefined) {
      connectorLevels[connector] = await getConnectorPermissionLevel(userId, connector);
    }

    const currentLevel = connectorLevels[connector]!;
    if (currentLevel >= requiredLevel) {
      visibleTools.push(toolName);
    }
  }

  return visibleTools;
}

/**
 * Get all connector permissions for a user
 * Returns permissions for all connectors, using defaults where not set
 */
export async function getAllConnectorPermissions(
  userId: string
): Promise<Record<ConnectorType, PermissionLevel>> {
  const connectors: ConnectorType[] = ["xero", "gmail", "google_sheets"];
  const permissions: Record<ConnectorType, PermissionLevel> = {
    xero: 0,
    gmail: 0,
    google_sheets: 0,
  };

  for (const connector of connectors) {
    permissions[connector] = await getConnectorPermissionLevel(userId, connector);
  }

  return permissions;
}

/**
 * Set permission level for a specific connector
 */
export async function setConnectorPermission(
  userId: string,
  connector: ConnectorType,
  permissionLevel: PermissionLevel
): Promise<ConnectorPermission> {
  const db = await getDb();
  return db.upsertConnectorPermission(userId, connector, permissionLevel);
}

/**
 * Format permission error message for agent response
 */
export function formatPermissionError(result: PermissionCheckResult): string {
  if (result.isVacationMode) {
    return result.reason || "Vacation mode is active. Only read-only operations are allowed.";
  }

  return result.reason || "Permission denied for this operation.";
}

/**
 * Get safety rules text for agent system prompt
 * Includes per-connector permission information
 */
export async function getSafetyRulesForPrompt(userId: string): Promise<string> {
  const settings = await getUserSettingsOrDefault(userId);
  const connectorPermissions = await getAllConnectorPermissions(userId);

  const rules: string[] = [
    `SAFETY RULES:`,
  ];

  // Add per-connector permission info
  for (const [connector, level] of Object.entries(connectorPermissions)) {
    const connectorName = connector.replace("_", " ").toUpperCase();
    const levelNames = CONNECTOR_PERMISSION_NAMES[connector as ConnectorType];
    rules.push(`- ${connectorName}: ${levelNames[level as PermissionLevel]}`);
  }

  // Add general guidance
  const hasAnyWriteAccess = Object.values(connectorPermissions).some(level => level > 0);

  if (!hasAnyWriteAccess) {
    rules.push(`- You CANNOT modify any data in connected services`);
    rules.push(`- If user asks you to make changes, explain they need to enable write permissions in Pip settings first`);
  } else {
    rules.push(`- Check permission level for each connector before attempting write operations`);
    rules.push(`- Each modification may require user confirmation depending on the connector`);
  }

  // Vacation mode
  if (settings.vacationModeUntil && settings.vacationModeUntil > Date.now()) {
    const vacationEnd = new Date(settings.vacationModeUntil).toLocaleDateString("en-AU");
    rules.push(`- VACATION MODE ACTIVE until ${vacationEnd} - READ-ONLY only for ALL connectors`);
  }

  return rules.join("\n");
}
