/**
 * QuickActionCategories - Claude.ai-style category buttons
 *
 * When clicked, opens a dropdown with prompts that auto-fill and submit.
 */

import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface CategoryPrompt {
  text: string;
  label: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompts: CategoryPrompt[];
}

interface QuickActionCategoriesProps {
  onSelectPrompt: (prompt: string) => void;
}

// ============================================================================
// Icons
// ============================================================================

const InvoiceIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TrendIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ============================================================================
// Categories Data
// ============================================================================

const categories: Category[] = [
  {
    id: 'invoices',
    label: 'Invoices',
    icon: <InvoiceIcon />,
    prompts: [
      { label: 'Show unpaid invoices', text: 'Show me all unpaid invoices and who owes me money' },
      { label: 'Overdue invoices this month', text: 'Which invoices are overdue this month and by how much?' },
      { label: 'Invoice aging summary', text: 'Give me an aging summary of my receivables' },
      { label: 'Top customers by outstanding', text: 'Who are my top 5 customers with outstanding invoices?' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <ChartIcon />,
    prompts: [
      { label: 'Profit and loss this month', text: 'Show me my profit and loss for this month' },
      { label: 'Balance sheet snapshot', text: 'What does my balance sheet look like right now?' },
      { label: 'Cash flow summary', text: 'Give me a summary of my cash flow situation' },
      { label: 'Monthly comparison', text: 'Compare this month to last month - revenue, expenses, profit' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    icon: <TrendIcon />,
    prompts: [
      { label: 'Can I afford to hire?', text: 'Based on my financials, can I afford to hire a new employee?' },
      { label: 'Biggest expenses', text: 'What are my biggest expense categories and are any unusual?' },
      { label: 'Revenue trends', text: 'What are my revenue trends over the last 3 months?' },
      { label: 'Cash runway', text: 'How long will my current cash last at current burn rate?' },
    ],
  },
  {
    id: 'lookup',
    label: 'Lookup',
    icon: <SearchIcon />,
    prompts: [
      { label: 'Find a contact', text: 'Help me find contact information for ' },
      { label: 'Recent transactions', text: 'Show me recent bank transactions from the last week' },
      { label: 'Search invoices', text: 'Search for invoices containing ' },
      { label: 'Organisation details', text: 'What are my Xero organisation details?' },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

export function QuickActionCategories({ onSelectPrompt }: QuickActionCategoriesProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
    setOpenCategory(null);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {categories.map((category) => (
        <div key={category.id} className="relative">
          {/* Category button */}
          <button
            onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border transition-colors ${
              openCategory === category.id
                ? 'bg-arc-bg-tertiary border-arc-accent text-arc-text-primary'
                : 'bg-arc-bg-secondary border-arc-border text-arc-text-secondary hover:border-arc-accent hover:text-arc-text-primary'
            }`}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>

          {/* Dropdown */}
          {openCategory === category.id && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setOpenCategory(null)} />

              {/* Menu */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-arc-bg-secondary border border-arc-border rounded-lg shadow-xl z-20">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-arc-border">
                  <div className="flex items-center gap-2 text-arc-text-primary">
                    {category.icon}
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <button
                    onClick={() => setOpenCategory(null)}
                    className="text-arc-text-dim hover:text-arc-text-primary transition-colors"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {/* Prompts */}
                <div className="py-1">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectPrompt(prompt.text)}
                      className="w-full text-left px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-tertiary transition-colors"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
