import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

interface Expense {
  id: number;
  amount: number;
  category: string;
  details: string;
  date: string;
  user_id: string;
}

type View = 'add' | 'list' | 'analytics' | 'categories';

const App = () => {
  // State for navigation
  const [view, setView] = useState<View>('add');

  // State for form inputs
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // State for expenses, categories, and editing
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  
  // State for Analytics filters
  const [analyticsStartDate, setAnalyticsStartDate] = useState('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState('');
  const [analyticsCategories, setAnalyticsCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // State for Export filters
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedExpenses = JSON.parse(localStorage.getItem('expenses') || '[]') as Expense[];
    setExpenses(storedExpenses);

    const defaultCategories = ['Eating out', 'Groceries', 'Chocolate', 'Transport', 'Entertainment', 'Gas', 'Shopping', 'Hiking', 'Gifts', 'Other'];
    const storedCategories = JSON.parse(localStorage.getItem('categories') || 'null');
    const initialCategories = storedCategories || defaultCategories;
    setCategories(initialCategories);
    if (!storedCategories) {
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }
    
    // Set default dates
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split('T')[0];
    const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];

    setAnalyticsStartDate(firstDayOfMonthStr);
    setAnalyticsEndDate(todayStr);
    setExportStartDate(firstDayOfMonthStr);
    setExportEndDate(todayStr);

  }, []);

  // Set default date to today for new expenses
  useEffect(() => {
    if (view === 'add' && !editingExpenseId) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);
    }
  }, [view, editingExpenseId]);

  // Handle clicks outside the category dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses]);

  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  }, [sortedExpenses, currentPage]);

  const groupedPaginatedExpenses = useMemo(() => {
    return paginatedExpenses.reduce((acc, expense) => {
        const expenseDate = new Date(expense.date);
        if (isNaN(expenseDate.getTime())) return acc;

        const monthYear = expenseDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(expense);
        return acc;
    }, {} as Record<string, Expense[]>);
  }, [paginatedExpenses]);

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);


  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDetails('');
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setDate(formattedDate);
    setEditingExpenseId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!amount || !category || !date) {
      alert('Please fill in Amount, Category, and Date.');
      return;
    }
    
    if (parseFloat(amount) <= 0) {
      alert('Amount must be greater than zero.');
      return;
    }

    if (editingExpenseId !== null) {
      const updatedExpenses = expenses.map(expense => 
        expense.id === editingExpenseId 
          ? { ...expense, amount: parseFloat(amount), category, details, date } 
          : expense
      );
      setExpenses(updatedExpenses);
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setSuccessMessage('Expense updated!');
    } else {
      const newExpense: Expense = {
        amount: parseFloat(amount),
        category,
        details,
        date,
        user_id: 'user_placeholder_01',
        id: Date.now(),
      };

      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
      setSuccessMessage('Expense saved!');
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    resetForm();
  };

  const handleEdit = (id: number) => {
    const expenseToEdit = expenses.find(expense => expense.id === id);
    if (expenseToEdit) {
      setAmount(String(expenseToEdit.amount));
      setCategory(expenseToEdit.category);
      setDetails(expenseToEdit.details);
      setDate(expenseToEdit.date);
      setEditingExpenseId(id);
      setView('add');
      window.scrollTo(0, 0);
    }
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
        if (editingExpenseId === id) {
            resetForm();
        }
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  }

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        setNewCategory('');
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This cannot be undone.`)) {
        const updatedCategories = categories.filter(c => c !== categoryToDelete);
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
    }
  };

  const handleAnalyticsCategoryChange = (category: string) => {
    setAnalyticsCategories(prev => 
        prev.includes(category) 
            ? prev.filter(c => c !== category)
            : [...prev, category]
    );
  };
  
  const handleExport = (format: 'json' | 'csv') => {
    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        if (isNaN(expenseDate.getTime())) return false;
        const startDate = new Date(exportStartDate);
        const endDate = new Date(exportEndDate);
        endDate.setHours(23, 59, 59, 999);
        return expenseDate >= startDate && expenseDate <= endDate;
    });

    if (filteredExpenses.length === 0) {
        alert('No expenses in the selected date range to export.');
        return;
    }
    
    let dataStr = '';
    let fileName = '';
    let fileType = '';

    if (format === 'json') {
        const dataToExport = {
            expenses: filteredExpenses,
            categories: categories
        };
        dataStr = JSON.stringify(dataToExport, null, 2);
        fileName = `expenses-${Date.now()}.json`;
        fileType = 'application/json';
    } else { // csv
        const headers = ['id', 'amount', 'category', 'details', 'date'];
        const rows = filteredExpenses.map(e => 
            [e.id, e.amount, e.category, `"${e.details.replace(/"/g, '""')}"`, e.date].join(',')
        );
        dataStr = [headers.join(','), ...rows].join('\n');
        fileName = `expenses-${Date.now()}.csv`;
        fileType = 'text/csv';
    }
    
    const blob = new Blob([dataStr], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredAnalyticsData = useMemo(() => {
    const expensesInRange = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        if (isNaN(expenseDate.getTime())) return false;
        const startDate = new Date(analyticsStartDate);
        const endDate = new Date(analyticsEndDate);
        endDate.setHours(23, 59, 59, 999);
        return expenseDate >= startDate && expenseDate <= endDate;
    });

    const relevantExpenses = analyticsCategories.length > 0
        ? expensesInRange.filter(e => analyticsCategories.includes(e.category))
        : expensesInRange;

    const data: { [key: string]: number } = {};
    relevantExpenses.forEach(e => {
        if (!data[e.category]) {
            data[e.category] = 0;
        }
        data[e.category] += e.amount;
    });
      
    return Object.entries(data).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total);
  }, [expenses, analyticsStartDate, analyticsEndDate, analyticsCategories]);
  
  const maxTotal = useMemo(() => Math.max(...filteredAnalyticsData.map(d => d.total), 0), [filteredAnalyticsData]);
  const CHART_MAX_HEIGHT_PX = 220;

  const getDropdownButtonText = () => {
    if (analyticsCategories.length === 0) {
        return 'Select categories (optional)';
    }
    if (analyticsCategories.length <= 2) {
        return analyticsCategories.join(', ');
    }
    return `${analyticsCategories.length} categories selected`;
  };

  const renderHeader = () => {
    let title = 'Add New Expense';
    if (view === 'list') title = 'My Expenses';
    if (view === 'analytics') title = 'Analytics';
    if (view === 'categories') title = 'Manage Categories';
    if (view === 'add' && editingExpenseId !== null) title = 'Edit Expense';

    return (
        <header className="app-header">
            {view !== 'add' && (
                <button className="back-btn" onClick={() => setView('add')} aria-label="Go back to main screen">
                    &larr;
                </button>
            )}
            <h1>{title}</h1>
        </header>
    );
  };

  return (
    <div className="app-container">
      {renderHeader()}
      
      {view === 'add' && (
        <>
          <form className="expense-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input id="amount" type="number" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" required aria-label="Expense Amount" />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required aria-label="Expense Category">
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="details">Details (Optional)</label>
              <textarea id="details" className="form-textarea" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g., Lunch with colleagues" aria-label="Expense Details"></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required aria-label="Expense Date" />
            </div>
            <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingExpenseId !== null ? 'Save Changes' : 'Add Expense'}
                </button>
                {editingExpenseId !== null && (
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                )}
            </div>
          </form>
          <div className={`success-message ${showSuccess ? 'visible' : ''}`}>{successMessage}</div>
          <nav className="main-nav">
              <button onClick={() => setView('analytics')}>Analytics</button>
              <button onClick={() => setView('list')}>View Expenses</button>
              <button onClick={() => setView('categories')}>Manage Categories</button>
          </nav>
        </>
      )}

      {view === 'list' && (
        <div className="expense-list-container">
          {expenses.length === 0 ? (
            <p className="no-expenses">No expenses logged yet.</p>
          ) : (
            <>
                {Object.entries(groupedPaginatedExpenses).map(([month, monthExpenses]) => (
                    <div key={month} className="month-group">
                        <h2 className="month-header">{month}</h2>
                        <ul className="expense-list">
                            {monthExpenses.map(expense => (
                                <li key={expense.id} className="expense-item" onClick={() => handleEdit(expense.id)} tabIndex={0} role="button" aria-label={`Edit expense of ${expense.amount} for ${expense.category} on ${expense.date}`}>
                                <div className="expense-item-info">
                                    <span className="expense-category">{expense.category}</span>
                                    <span className="expense-details">{expense.details}</span>
                                    <span className="expense-date">{expense.date}</span>
                                </div>
                                <div className="expense-item-right">
                                    <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }} aria-label={`Delete expense of ${expense.amount} for ${expense.category}`}>
                                    &times;
                                    </button>
                                </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <button className="pagination-btn" onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
                            &larr; Previous
                        </button>
                        <span className="page-info">Page {currentPage} of {totalPages}</span>
                        <button className="pagination-btn" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}>
                            Next &rarr;
                        </button>
                    </div>
                )}
            </>
          )}
        </div>
      )}

      {view === 'categories' && (
        <div className="categories-container">
            <div className="category-add-form">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="form-input" />
                <button onClick={handleAddCategory} className="submit-btn">Add</button>
            </div>
            <ul className="category-list">
                {categories.map(cat => (
                    <li key={cat} className="category-item">
                        <span>{cat}</span>
                        <button className="delete-btn" onClick={() => handleDeleteCategory(cat)}>&times;</button>
                    </li>
                ))}
            </ul>
        </div>
      )}
      
      {view === 'analytics' && (
        <div className="analytics-container">
            <div className="analytics-filters">
                <div className="date-filter-group">
                    <div className="form-group">
                        <label htmlFor="start-date">Start Date</label>
                        <input type="date" id="start-date" className="form-input" value={analyticsStartDate} onChange={e => setAnalyticsStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end-date">End Date</label>
                        <input type="date" id="end-date" className="form-input" value={analyticsEndDate} onChange={e => setAnalyticsEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                  <label>Categories</label>
                  <div className="dropdown-container" ref={dropdownRef}>
                    <button className="dropdown-trigger" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                        {getDropdownButtonText()}
                    </button>
                    {isCategoryDropdownOpen && (
                        <div className="dropdown-panel">
                            {categories.map(cat => (
                            <div key={cat} className="checkbox-wrapper">
                                <input 
                                type="checkbox" 
                                id={`cat-checkbox-${cat}`} 
                                value={cat}
                                checked={analyticsCategories.includes(cat)}
                                onChange={() => handleAnalyticsCategoryChange(cat)}
                                />
                                <label htmlFor={`cat-checkbox-${cat}`}>{cat}</label>
                            </div>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
            </div>
            <div className="chart-container">
                {filteredAnalyticsData.length > 0 ? (
                  filteredAnalyticsData.map(item => {
                    const barHeight = maxTotal > 0 ? (item.total / maxTotal) * CHART_MAX_HEIGHT_PX : 0;
                    return (
                      <div className="chart-item-vertical" key={item.name}>
                          <div className="chart-value-vertical">${item.total.toFixed(2)}</div>
                          <div className="chart-bar-vertical" style={{ height: `${barHeight}px` }}></div>
                          <div className="chart-label-vertical">{item.name}</div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-expenses">No data for selected filters.</p>
                )}
            </div>
            <div className="export-container">
              <h3>Export Data</h3>
              <div className="export-filters">
                  <div className="form-group">
                      <label htmlFor="export-start-date">Start Date</label>
                      <input type="date" id="export-start-date" className="form-input" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                      <label htmlFor="export-end-date">End Date</label>
                      <input type="date" id="export-end-date" className="form-input" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
                  </div>
              </div>
              <div className="export-actions">
                  <button className="export-btn" onClick={() => handleExport('json')}>Export as JSON</button>
                  <button className="export-btn" onClick={() => handleExport('csv')}>Export as CSV</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);