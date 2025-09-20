import { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { formatDateKey } from '../utils/dateUtils';
import { Transaction } from '../types';

/**
 * 取引データ操作の共通フック
 */
export const useTransactionData = () => {
  const { 
    transactions, 
    selectedDate, 
    siteIncomes, 
    siteExpenses 
  } = useTransactions();

  // 選択日の取引データを計算（新しい現場別データを使用）
  const dayData = useMemo(() => {
    if (!selectedDate) {
      return { income: 0, expense: 0, balance: 0 };
    }
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    // 現場別入金データから該当日の入金を計算
    const dayIncome = siteIncomes
      .filter(income => income.date === dateKey)
      .reduce((sum, income) => sum + income.amount, 0);
    
    // 現場別支出データから該当日の支出を計算
    const dayExpense = siteExpenses
      .filter(expense => expense.date === dateKey)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // 収支を計算
    const balance = dayIncome - dayExpense;
    
    return {
      income: dayIncome,
      expense: dayExpense,
      balance: balance
    };
  }, [siteIncomes, siteExpenses, selectedDate]);

  // 選択日の現場別入金データを取得
  const dayIncomes = useMemo(() => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return siteIncomes.filter(income => income.date === dateKey);
  }, [siteIncomes, selectedDate]);

  // 選択日の現場別支出データを取得
  const dayExpenses = useMemo(() => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return siteExpenses.filter(expense => expense.date === dateKey);
  }, [siteExpenses, selectedDate]);

  // 選択日の全取引を取得（後方互換性のため維持）
  const getDayTransactions = useMemo((): Transaction[] => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return transactions.filter(t => t.date === dateKey);
  }, [transactions, selectedDate]);

  // 選択日の入金取引を取得（後方互換性のため維持）
  const incomeTransactions = useMemo((): Transaction[] => {
    return getDayTransactions.filter(t => t.type === 'income');
  }, [getDayTransactions]);

  // 選択日の支出取引を取得（後方互換性のため維持）
  const expenseTransactions = useMemo((): Transaction[] => {
    return getDayTransactions.filter(t => t.type === 'expense');
  }, [getDayTransactions]);

  // 指定タイプの取引を取得
  const getTransactionsByType = (type: 'income' | 'expense'): Transaction[] => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return transactions.filter(t => t.date === dateKey && t.type === type);
  };

  // 指定日の取引データを計算（現場別データを使用）
  const getDayDataForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    // 現場別入金データから該当日の入金を計算
    const dayIncome = siteIncomes
      .filter(income => income.date === dateKey)
      .reduce((sum, income) => sum + income.amount, 0);
    
    // 現場別支出データから該当日の支出を計算
    const dayExpense = siteExpenses
      .filter(expense => expense.date === dateKey)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // 収支を計算
    const balance = dayIncome - dayExpense;
    
    return {
      income: dayIncome,
      expense: dayExpense,
      balance: balance
    };
  };

  return {
    // 計算済みデータ
    dayData,
    getDayTransactions,
    incomeTransactions,
    expenseTransactions,
    
    // 新しい現場別データ
    dayIncomes,
    dayExpenses,
    
    // 関数
    getTransactionsByType,
    getDayDataForDate
  };
};
