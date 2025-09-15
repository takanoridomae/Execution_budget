import { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { calculateDayData } from '../utils/transactionCalculations';
import { formatDateKey } from '../utils/dateUtils';
import { Transaction } from '../types';

/**
 * 取引データ操作の共通フック
 */
export const useTransactionData = () => {
  const { transactions, selectedDate } = useTransactions();

  // 選択日の取引データを計算
  const dayData = useMemo(() => {
    if (!selectedDate) {
      return { income: 0, expense: 0, balance: 0 };
    }
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return calculateDayData(transactions, dateKey);
  }, [transactions, selectedDate]);

  // 選択日の全取引を取得
  const getDayTransactions = useMemo((): Transaction[] => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return transactions.filter(t => t.date === dateKey);
  }, [transactions, selectedDate]);

  // 選択日の収入取引を取得
  const incomeTransactions = useMemo((): Transaction[] => {
    return getDayTransactions.filter(t => t.type === 'income');
  }, [getDayTransactions]);

  // 選択日の支出取引を取得
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

  // 指定日の取引データを計算
  const getDayDataForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateKey = formatDateKey(year, month, day);
    
    return calculateDayData(transactions, dateKey);
  };

  return {
    // 計算済みデータ
    dayData,
    getDayTransactions,
    incomeTransactions,
    expenseTransactions,
    
    // 関数
    getTransactionsByType,
    getDayDataForDate
  };
};
