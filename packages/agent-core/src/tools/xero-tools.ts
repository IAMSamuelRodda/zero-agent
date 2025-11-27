/**
 * Xero Tools for Agent
 *
 * Tool definitions that the LLM can call to interact with Xero API
 */

import type { XeroClient } from "../xero/client.js";

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any, userId: string) => Promise<any>;
}

export function createXeroTools(xeroClient: XeroClient): Tool[] {
  return [
    {
      name: "get_invoices",
      description:
        "Get invoices from Xero. Can filter by status (DRAFT, AUTHORISED, PAID, VOIDED). Use this when user asks about invoices, bills, or outstanding payments.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["DRAFT", "SUBMITTED", "AUTHORISED", "PAID", "VOIDED"],
            description: "Filter by invoice status",
          },
          limit: {
            type: "number",
            description: "Maximum number of invoices to return (default: 10)",
          },
        },
      },
      execute: async (params, userId) => {
        const invoices = await xeroClient.getInvoices(userId, {
          status: params.status,
        });

        // Limit results
        const limited = invoices.slice(0, params.limit || 10);

        // Simplify response for LLM
        return limited.map((inv: any) => ({
          invoiceNumber: inv.InvoiceNumber,
          contact: inv.Contact?.Name,
          date: inv.Date,
          dueDate: inv.DueDate,
          status: inv.Status,
          total: inv.Total,
          amountDue: inv.AmountDue,
          currencyCode: inv.CurrencyCode,
        }));
      },
    },
    {
      name: "get_invoice",
      description: "Get details of a specific invoice by its ID or invoice number",
      parameters: {
        type: "object",
        properties: {
          invoiceId: {
            type: "string",
            description: "The Xero invoice ID (GUID format)",
          },
        },
        required: ["invoiceId"],
      },
      execute: async (params, userId) => {
        const invoice = await xeroClient.getInvoice(userId, params.invoiceId);

        return {
          invoiceNumber: invoice.InvoiceNumber,
          contact: invoice.Contact?.Name,
          date: invoice.Date,
          dueDate: invoice.DueDate,
          status: invoice.Status,
          lineItems: invoice.LineItems?.map((item: any) => ({
            description: item.Description,
            quantity: item.Quantity,
            unitAmount: item.UnitAmount,
            lineAmount: item.LineAmount,
            accountCode: item.AccountCode,
          })),
          subtotal: invoice.SubTotal,
          totalTax: invoice.TotalTax,
          total: invoice.Total,
          amountDue: invoice.AmountDue,
          currencyCode: invoice.CurrencyCode,
        };
      },
    },
    {
      name: "get_contacts",
      description:
        "Get contacts (customers/suppliers) from Xero. Use when user asks about customers, clients, or suppliers.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of contacts to return (default: 10)",
          },
        },
      },
      execute: async (params, userId) => {
        const contacts = await xeroClient.getContacts(userId);

        const limited = contacts.slice(0, params.limit || 10);

        return limited.map((contact: any) => ({
          name: contact.Name,
          contactId: contact.ContactID,
          emailAddress: contact.EmailAddress,
          phoneNumbers: contact.Phones?.map((p: any) => ({
            type: p.PhoneType,
            number: p.PhoneNumber,
          })),
          isCustomer: contact.IsCustomer,
          isSupplier: contact.IsSupplier,
        }));
      },
    },
    {
      name: "get_organisation",
      description:
        "Get organization details from Xero (company name, address, tax number, etc.)",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: async (params, userId) => {
        const org = await xeroClient.getOrganisation(userId);

        return {
          name: org.Name,
          legalName: org.LegalName,
          organisationStatus: org.OrganisationStatus,
          baseCurrency: org.BaseCurrency,
          countryCode: org.CountryCode,
          taxNumber: org.TaxNumber,
          financialYearEndDay: org.FinancialYearEndDay,
          financialYearEndMonth: org.FinancialYearEndMonth,
        };
      },
    },
    {
      name: "get_profit_and_loss",
      description:
        "Get profit & loss report from Xero for a date range. Use when user asks about revenue, expenses, or profit.",
      parameters: {
        type: "object",
        properties: {
          fromDate: {
            type: "string",
            description: "Start date in YYYY-MM-DD format",
          },
          toDate: {
            type: "string",
            description: "End date in YYYY-MM-DD format",
          },
        },
      },
      execute: async (params, userId) => {
        const report = await xeroClient.getProfitAndLoss(userId, {
          fromDate: params.fromDate,
          toDate: params.toDate,
        });

        // Simplify the complex report structure
        return {
          reportName: report.ReportName,
          reportDate: report.ReportDate,
          updatedDateUTC: report.UpdatedDateUTC,
          summary: {
            // Extract key figures from report rows
            // This is simplified - real implementation would parse Rows array
            message: "P&L report retrieved. Parse report.Rows for detailed breakdown.",
          },
        };
      },
    },
    {
      name: "get_balance_sheet",
      description:
        "Get balance sheet report from Xero as of a specific date. Shows assets, liabilities, and equity.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format (defaults to today)",
          },
        },
      },
      execute: async (params, userId) => {
        const report = await xeroClient.getBalanceSheet(
          userId,
          params.date
        );

        return {
          reportName: report.ReportName,
          reportDate: report.ReportDate,
          updatedDateUTC: report.UpdatedDateUTC,
          summary: {
            message: "Balance sheet retrieved. Parse report.Rows for detailed breakdown.",
          },
        };
      },
    },
    {
      name: "get_aged_receivables",
      description:
        "Get aged receivables report showing who owes money and how long invoices have been outstanding. Essential for understanding cash flow and overdue accounts.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date for aging calculation in YYYY-MM-DD format (defaults to today)",
          },
        },
      },
      execute: async (params, userId) => {
        const report = await xeroClient.getAgedReceivables(userId, params.date);

        // Parse the report rows to extract useful data
        const rows = report?.Rows || [];
        const contacts: any[] = [];

        // Find the data rows (skip header rows)
        for (const row of rows) {
          if (row.RowType === "Section" && row.Rows) {
            for (const dataRow of row.Rows) {
              if (dataRow.RowType === "Row" && dataRow.Cells) {
                const cells = dataRow.Cells;
                contacts.push({
                  contact: cells[0]?.Value,
                  current: cells[1]?.Value,
                  days1to30: cells[2]?.Value,
                  days31to60: cells[3]?.Value,
                  days61to90: cells[4]?.Value,
                  over90Days: cells[5]?.Value,
                  total: cells[6]?.Value,
                });
              }
            }
          }
        }

        return {
          reportName: report?.ReportName,
          reportDate: report?.ReportDate,
          contacts: contacts.slice(0, 20), // Limit to top 20
          totalContacts: contacts.length,
        };
      },
    },
    {
      name: "get_aged_payables",
      description:
        "Get aged payables report showing who you owe money to and how overdue the bills are.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date for aging calculation in YYYY-MM-DD format (defaults to today)",
          },
        },
      },
      execute: async (params, userId) => {
        const report = await xeroClient.getAgedPayables(userId, params.date);

        const rows = report?.Rows || [];
        const suppliers: any[] = [];

        for (const row of rows) {
          if (row.RowType === "Section" && row.Rows) {
            for (const dataRow of row.Rows) {
              if (dataRow.RowType === "Row" && dataRow.Cells) {
                const cells = dataRow.Cells;
                suppliers.push({
                  supplier: cells[0]?.Value,
                  current: cells[1]?.Value,
                  days1to30: cells[2]?.Value,
                  days31to60: cells[3]?.Value,
                  days61to90: cells[4]?.Value,
                  over90Days: cells[5]?.Value,
                  total: cells[6]?.Value,
                });
              }
            }
          }
        }

        return {
          reportName: report?.ReportName,
          reportDate: report?.ReportDate,
          suppliers: suppliers.slice(0, 20),
          totalSuppliers: suppliers.length,
        };
      },
    },
    {
      name: "search_contacts",
      description:
        "Search for a customer or supplier by name. Use when user asks about a specific contact, patient, client, or supplier.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description: "Name or partial name to search for",
          },
        },
        required: ["searchTerm"],
      },
      execute: async (params, userId) => {
        const contacts = await xeroClient.searchContacts(userId, params.searchTerm);

        return contacts.slice(0, 10).map((contact: any) => ({
          name: contact.Name,
          contactId: contact.ContactID,
          emailAddress: contact.EmailAddress,
          phoneNumber: contact.Phones?.find((p: any) => p.PhoneNumber)?.PhoneNumber,
          isCustomer: contact.IsCustomer,
          isSupplier: contact.IsSupplier,
          accountsReceivableOutstanding: contact.Balances?.AccountsReceivable?.Outstanding,
          accountsPayableOutstanding: contact.Balances?.AccountsPayable?.Outstanding,
        }));
      },
    },
    {
      name: "get_bank_transactions",
      description:
        "Get recent bank transactions. Use when user asks about recent payments, bank activity, or money movement.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of transactions to return (default: 10)",
          },
        },
      },
      execute: async (params, userId) => {
        const transactions = await xeroClient.getBankTransactions(userId);

        return transactions.slice(0, params.limit || 10).map((txn: any) => ({
          type: txn.Type, // SPEND or RECEIVE
          date: txn.Date,
          contact: txn.Contact?.Name,
          description: txn.LineItems?.[0]?.Description,
          total: txn.Total,
          status: txn.Status,
          bankAccount: txn.BankAccount?.Name,
          reference: txn.Reference,
        }));
      },
    },
    {
      name: "get_bank_accounts",
      description:
        "Get list of bank accounts and their balances. Use when user asks about bank balances or cash position.",
      parameters: {
        type: "object",
        properties: {},
      },
      execute: async (params, userId) => {
        const accounts = await xeroClient.getBankAccounts(userId);

        return accounts.map((account: any) => ({
          name: account.Name,
          code: account.Code,
          type: account.BankAccountType,
          currencyCode: account.CurrencyCode,
          balance: account.BankAccountBalance,
        }));
      },
    },
  ];
}
