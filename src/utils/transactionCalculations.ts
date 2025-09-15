import { Transaction } from '../types';

/**
 * 取引データから収支を計算するユーティリティ関数群
 */

/**
 * 指定された取引リストから収入・支出・残高を計算
 */
export const calculateFinancialSummary = (transactions: Transaction[]) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  return { income, expense, balance };
};

/**
 * 指定された日付の取引データを計算
 */
export const calculateDayData = (transactions: Transaction[], targetDate: string) => {
  const dayTransactions = transactions.filter(transaction => 
    transaction.date === targetDate
  );
  
  return calculateFinancialSummary(dayTransactions);
};

/**
 * 指定された年月の取引データを計算
 */
export const calculateMonthlyData = (transactions: Transaction[], year: number, month: number) => {
  const monthlyTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getFullYear() === year &&
           transactionDate.getMonth() + 1 === month;
  });
  
  return calculateFinancialSummary(monthlyTransactions);
};

/**
 * 現在の月の取引データを計算
 */
export const calculateCurrentMonthData = (transactions: Transaction[]) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  return calculateMonthlyData(transactions, currentYear, currentMonth);
};

/**
 * 指定された期間の取引データを計算
 */
export const calculatePeriodData = (
  transactions: Transaction[], 
  startDate: string, 
  endDate: string
) => {
  const periodTransactions = transactions.filter(transaction => 
    transaction.date >= startDate && transaction.date <= endDate
  );
  
  return calculateFinancialSummary(periodTransactions);
};

/**
 * カテゴリ別の集計データを計算
 */
export const calculateCategoryBreakdown = (transactions: Transaction[]) => {
  const incomeByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();
  
  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      const current = incomeByCategory.get(transaction.category) || 0;
      incomeByCategory.set(transaction.category, current + transaction.amount);
    } else {
      const current = expenseByCategory.get(transaction.category) || 0;
      expenseByCategory.set(transaction.category, current + transaction.amount);
    }
  });
  
  return {
    incomeByCategory: Object.fromEntries(incomeByCategory),
    expenseByCategory: Object.fromEntries(expenseByCategory)
  };
};

/**
 * 指定された月の日付毎の収支データを計算
 */
export const calculateDailyData = (transactions: Transaction[], year: number, month: number) => {
  const dailyData = new Map<number, { income: number; expense: number; balance: number }>();
  
  // 指定月の全日数を取得
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // 全日付を初期化
  for (let day = 1; day <= daysInMonth; day++) {
    dailyData.set(day, { income: 0, expense: 0, balance: 0 });
  }
  
  // 指定月の取引データをフィルタリング
  const monthlyTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getFullYear() === year &&
           transactionDate.getMonth() + 1 === month;
  });
  
  // 日付毎に集計
  monthlyTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    const day = transactionDate.getDate();
    const currentData = dailyData.get(day) || { income: 0, expense: 0, balance: 0 };
    
    if (transaction.type === 'income') {
      currentData.income += transaction.amount;
    } else {
      currentData.expense += transaction.amount;
    }
    
    currentData.balance = currentData.income - currentData.expense;
    dailyData.set(day, currentData);
  });
  
  return Object.fromEntries(dailyData);
};

/**
 * 現在月の日付毎の収支データを計算
 */
export const calculateCurrentMonthDailyData = (transactions: Transaction[]) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  return calculateDailyData(transactions, currentYear, currentMonth);
};

/**
 * 指定された期間の日付毎の収支データを計算
 */
export const calculatePeriodDailyData = (
  transactions: Transaction[], 
  startDate: string, 
  endDate: string
) => {
  const dailyData = new Map<string, { income: number; expense: number; balance: number }>();
  
  // 期間内の取引データをフィルタリング
  const periodTransactions = transactions.filter(transaction => 
    transaction.date >= startDate && transaction.date <= endDate
  );
  
  // 日付毎に集計
  periodTransactions.forEach(transaction => {
    const dateKey = transaction.date;
    const currentData = dailyData.get(dateKey) || { income: 0, expense: 0, balance: 0 };
    
    if (transaction.type === 'income') {
      currentData.income += transaction.amount;
    } else {
      currentData.expense += transaction.amount;
    }
    
    currentData.balance = currentData.income - currentData.expense;
    dailyData.set(dateKey, currentData);
  });
  
  return Object.fromEntries(dailyData);
};

