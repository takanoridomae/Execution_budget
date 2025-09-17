import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardHeader, CardContent, Button, FormControl, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, InputLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend as ReLegend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Photo, Close } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { getImageFromLocalStorage } from '../utils/imageUtils';
import { formatDateKey } from '../utils/dateUtils';
import { formatCurrency } from '../utils/numberUtils';
import { useBudget } from '../contexts/BudgetContext';

type BreakdownType = 'income' | 'expense';

const Report: React.FC = () => {
  const { transactions, selectedDate } = useTransactions();
  // Default to hide income for daily view and expense-based breakdown for pie chart
  const [showIncome, setShowIncome] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('report_day_income_visible');
      if (v !== null) return v === 'true';
    } catch { /* ignore */ }
    return false;
  });
  const [breakdownType, setBreakdownType] = useState<BreakdownType>(() => {
    try {
      const v = localStorage.getItem('report_pie_breakdown_type');
      if (v === 'income' || v === 'expense') return v as BreakdownType;
    } catch { /* ignore */ }
    return 'expense';
  });
  
  // 円グラフの表示形式（金額/パーセント）切り替え状態
  const [pieDisplayMode, setPieDisplayMode] = useState<'amount' | 'percentage'>(() => {
    try {
      const v = localStorage.getItem('report_pie_display_mode');
      if (v === 'amount' || v === 'percentage') return v as 'amount' | 'percentage';
    } catch { /* ignore */ }
    return 'amount';
  });
  // Persist breakdown type
  useEffect(() => {
    try {
      localStorage.setItem('report_pie_breakdown_type', breakdownType);
    } catch { /* ignore */ }
  }, [breakdownType]);
  
  // Persist pie display mode
  useEffect(() => {
    try {
      localStorage.setItem('report_pie_display_mode', pieDisplayMode);
    } catch { /* ignore */ }
  }, [pieDisplayMode]);
  // Restore initial breakdown type
  useEffect(() => {
    try {
      const v = localStorage.getItem('report_pie_breakdown_type');
      if (v === 'income' || v === 'expense') {
        setBreakdownType(v);
      }
    } catch {
      // ignore
    }
  }, []);
  // Persist day-income visibility
  useEffect(() => {
    try {
      localStorage.setItem('report_day_income_visible', String(showIncome));
    } catch { /* ignore */ }
  }, [showIncome]);
  // Restore day-income visibility
  useEffect(() => {
    try {
      const v = localStorage.getItem('report_day_income_visible');
      if (v !== null) {
        setShowIncome(v === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  // UI: current month view
  // Restore last viewed year/month from localStorage, fallback to current date
  const [viewDate, setViewDate] = useState<Date>(() => {
    try {
      const stored = localStorage.getItem('report_last_viewed_year_month');
      if (stored) {
        const [y, m] = stored.split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          return new Date(y, m - 1, 1);
        }
      }
    } catch { /* ignore */ }
    return new Date();
  });
  const [selectedYear, setSelectedYear] = useState<number>(viewDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(viewDate.getMonth() + 1);
  
  // Year/Month options
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Sync UI selections with viewDate
  useEffect(() => {
    // construct first day of selected year/month
    const newDate = new Date(selectedYear, selectedMonth - 1, 1);
    setViewDate(newDate);
  }, [selectedYear, selectedMonth]);

  // Reflect changes in viewDate back to selects when navigation buttons modify the date
  useEffect(() => {
    setSelectedYear(viewDate.getFullYear());
    setSelectedMonth(viewDate.getMonth() + 1);
  }, [viewDate]);
  
  // Update selects to parse current viewDate on init/prop changes
  useEffect(() => {
    setSelectedYear(viewDate.getFullYear());
    setSelectedMonth(viewDate.getMonth() + 1);
  }, []);
  
  // Handlers for year/month changes
  const onYearChange = (e: any) => setSelectedYear(Number(e.target.value));
  const onMonthChange = (e: any) => setSelectedMonth(Number(e.target.value));

  // getBudgetSettingsは削除されました（現場ベース管理に移行）
  // const { getBudgetSettings } = useBudget();

  useEffect(() => {
    const base = selectedDate ?? new Date();
    const newDate = new Date(base.getFullYear(), base.getMonth(), 1);
    setViewDate(newDate);
  }, [selectedDate]);

  // Persist last viewed (year, month) - not restoring on load to avoid unexpected initializations
  useEffect(() => {
    try {
      localStorage.setItem('report_last_viewed_year_month', `${viewDate.getFullYear()}-${viewDate.getMonth() + 1}`);
    } catch {
      // ignore
    }
  }, [viewDate]);

  // Extra guard: on mount, re-apply persisted UI state to avoid potential initialization drift
  useEffect(() => {
    try {
      const savedPie = localStorage.getItem('report_pie_breakdown_type');
      if (savedPie === 'income' || savedPie === 'expense') {
        setBreakdownType(savedPie);
      }
      const savedPieDisplayMode = localStorage.getItem('report_pie_display_mode');
      if (savedPieDisplayMode === 'amount' || savedPieDisplayMode === 'percentage') {
        setPieDisplayMode(savedPieDisplayMode);
      }
      const savedIncome = localStorage.getItem('report_day_income_visible');
      if (savedIncome !== null) {
        setShowIncome(savedIncome === 'true');
      }
      const savedLastViewed = localStorage.getItem('report_last_viewed_year_month');
      if (savedLastViewed) {
        const [y, m] = savedLastViewed.split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          setViewDate(new Date(y, m - 1, 1));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { try { localStorage.setItem('report_day_income_visible', String(showIncome)); } catch { } }, [showIncome]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthStart = formatDateKey(year, month, 1);
  const monthEnd = formatDateKey(year, month, daysInMonth);
  const monthTransactions = (transactions ?? []).filter((t) => t.date >= monthStart && t.date <= monthEnd);

  const incomeTotal = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const breakdownForMonth = monthTransactions.filter((t) => t.type === breakdownType);
  const byCategory: Record<string, number> = {};
  breakdownForMonth.forEach((t) => {
    const key = t.category as string;
    byCategory[key] = (byCategory[key] ?? 0) + t.amount;
  });
  
  // 合計値を計算（パーセンテージ表示用）
  const totalAmount = Object.values(byCategory).reduce((sum, amount) => sum + amount, 0);
  
  // 表示形式に応じてデータを変換
  const pieData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
    displayValue: pieDisplayMode === 'percentage' 
      ? totalAmount > 0 ? ((value / totalAmount) * 100) : 0
      : value,
    formattedDisplay: pieDisplayMode === 'percentage'
      ? totalAmount > 0 ? `${((value / totalAmount) * 100).toFixed(1)}%` : '0%'
      : formatCurrency(value)
  }));

  const dayData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dayTx = monthTransactions.filter((t) => t.date === formatDateKey(year, month, d));
    const incomeDay = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenseDay = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { day: d, income: incomeDay, expense: expenseDay };
  });

  const monthLabel = `${year}年${month}月`;

  // 現場ベース管理に移行したため、一時的に無効化
  const budgetInfo = { monthlyBudget: 0, savingsGoal: 0, breakdown: [] };
  const budgetForMonth = budgetInfo?.monthlyBudget ?? 0;
  const remainingBudget = budgetForMonth - expenseTotal;
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month;
  const remainingDays = isCurrentMonth ? Math.max(1, daysInMonth - todayDate.getDate() + 1) : daysInMonth;
  const dailyUsableAmount = remainingDays > 0 ? Math.floor(remainingBudget / remainingDays) : 0;

  const goPrevMonth = () => setViewDate(new Date(year, month - 2, 1));
  const goNextMonth = () => setViewDate(new Date(year, month, 1));

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd3c7', '#a6cee3'];
  // 日付ソート用状態
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc'|'desc'>('asc');
  
  // 画像表示用状態
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const toggleExpenseSort = () => setExpenseSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  
  // 画像表示ハンドラー
  const handleImageClick = (transaction: any) => {
    const images: string[] = [];
    
    // ローカルストレージの画像を追加
    if (transaction.imageIds) {
      transaction.imageIds.forEach((imageId: string) => {
        const imageData = getImageFromLocalStorage(transaction.id, imageId);
        if (imageData) {
          images.push(imageData);
        }
      });
    }
    
    // 後方互換性: Firebase Storageの画像を追加
    if (transaction.imageUrls) {
      images.push(...transaction.imageUrls);
    }
    
    setSelectedImages(images);
    setCurrentImageIndex(0);
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0));
  };
  
  const sortedExpenseTx = useMemo(() => {
    const expenses = (monthTransactions.filter((t) => t.type === 'expense')) ?? [];
    const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
    return expenseSortOrder === 'asc' ? sorted : [...sorted].reverse();
  }, [monthTransactions, expenseSortOrder]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button variant="contained" color="error" onClick={goPrevMonth}>先月</Button>
          <Button variant="contained" color="primary" onClick={goNextMonth} sx={{ ml: 1 }}>次月</Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel shrink={true}>年</InputLabel>
            <Select value={selectedYear} onChange={onYearChange} label="年">
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>{y}年</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel shrink={true}>月</InputLabel>
            <Select value={selectedMonth} onChange={onMonthChange} label="月">
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>{m}月</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card>
          <CardHeader title="内訳（円グラフ）" subheader="選択月の収支をカテゴリ別に表示" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 1 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <Select value={breakdownType} onChange={(e) => setBreakdownType(e.target.value as BreakdownType)}>
                  <MenuItem value="income">収入で内訳</MenuItem>
                  <MenuItem value="expense">支出で内訳</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setPieDisplayMode(pieDisplayMode === 'amount' ? 'percentage' : 'amount')}
                sx={{ minWidth: 120 }}
              >
                {pieDisplayMode === 'amount' ? '％表示' : '金額表示'}
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="displayValue" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40} 
                  outerRadius={90} 
                  paddingAngle={2} 
                  label={({ name, formattedDisplay }) => `${name}: ${formattedDisplay}`}
                >
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => {
                    const entry = pieData.find(item => item.name === name);
                    return entry ? [entry.formattedDisplay, name] : [value, name];
                  }}
                />
                <ReLegend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="日別収支（棒グラフ）" subheader="日ごとの収入/支出を表示" />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="outlined" size="small" onClick={() => setShowIncome((s) => !s)}>
                {showIncome ? '収入を非表示' : '収入を表示'}
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dayData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <ReLegend />
                {showIncome && <Bar dataKey="income" name="収入" fill="#42a5f5" />}
                <Bar dataKey="expense" name="支出" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 3, mt: 3 }}>
        <Card>
          <CardHeader title="支出明細" subheader="今月の支出の詳細を日付・カテゴリ・金額・内容で表示" />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="outlined" size="small" onClick={toggleExpenseSort}>
                日付: {expenseSortOrder === 'asc' ? '昇順' : '降順'}
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="今月の支出明細テーブル">
                <TableHead>
                  <TableRow>
                    <TableCell>日付</TableCell>
                    <TableCell>カテゴリ</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>詳細</TableCell>
                    <TableCell>画像</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedExpenseTx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.category as string}</TableCell>
                      <TableCell sx={{ backgroundColor: t.amount >= 2000 ? '#f44336' : t.amount >= 1000 ? '#FFF176' : 'inherit', color: t.amount >= 2000 ? 'white' : t.amount >= 1000 ? 'black' : 'inherit' }}>{formatCurrency(t.amount)}</TableCell>
                      <TableCell>{t.content}</TableCell>
                      <TableCell>
                        {((t.imageIds && t.imageIds.length > 0) || (t.imageUrls && t.imageUrls.length > 0)) ? (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleImageClick(t)}
                          >
                            <Photo />
                          </IconButton>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={`${monthLabel}の予算詳細`} subheader="選択月の予算・支出・残額と日割り可能額" />
          <CardContent>
            {/* 全体予算サマリー */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small" aria-label="選択月の予算詳細テーブル">
                <TableHead>
                  <TableRow>
                    <TableCell>選択月予算</TableCell>
                    <TableCell>選択月支出</TableCell>
                    <TableCell>選択月予算残</TableCell>
                    <TableCell>1日あたり使える金額</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{formatCurrency(budgetForMonth)}</TableCell>
                    <TableCell>{formatCurrency(expenseTotal)}</TableCell>
                    <TableCell 
                      sx={{
                        color: remainingBudget < 0 ? '#f44336' : 'inherit',
                        fontWeight: remainingBudget < 0 ? 'bold' : 'normal'
                      }}
                    >
                      {formatCurrency(remainingBudget)}
                    </TableCell>
                    <TableCell>{formatCurrency(dailyUsableAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* カテゴリー別予算vs支出 */}
            {(() => {
              // 現場ベース管理に移行したため、予算比較機能は簡素化
              
              // 支出があるすべてのカテゴリーを取得
              const expenseCategories = Array.from(new Set(
                monthTransactions
                  .filter(t => t.type === 'expense')
                  .map(t => t.category)
              ));
              
              // 表示用データを作成（現場ベース管理移行により予算比較は簡素化）
              const categoryData = expenseCategories.map(category => {
                const budgetAmount = 0; // 現場ベース管理に移行したため一時的に0
                const categoryExpense = monthTransactions
                  .filter(t => t.type === 'expense' && t.category === category)
                  .reduce((sum, t) => sum + t.amount, 0);
                
                return {
                  category,
                  budgetAmount,
                  categoryExpense
                };
              }).filter(item => item.categoryExpense > 0 || item.budgetAmount > 0); // 支出があるか予算があるもののみ表示
              
              return categoryData.length > 0 ? (
                <Box>
                  <Box sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
                    カテゴリー別予算比較
                  </Box>
                  <TableContainer component={Paper}>
                    <Table size="small" aria-label="カテゴリー別予算比較テーブル">
                      <TableHead>
                        <TableRow>
                          <TableCell>カテゴリー</TableCell>
                          <TableCell>予算額</TableCell>
                          <TableCell>実支出</TableCell>
                          <TableCell>予算残</TableCell>
                          <TableCell>進捗率</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryData.map((item) => {
                          const remaining = item.budgetAmount - item.categoryExpense;
                          const usageRate = item.budgetAmount > 0 ? (item.categoryExpense / item.budgetAmount) * 100 : 0;
                          const isOver = remaining < 0;
                          const isUnbudgeted = item.budgetAmount === 0;

                          return (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell 
                                sx={{ 
                                  color: isUnbudgeted ? '#9e9e9e' : 'inherit',
                                  fontStyle: isUnbudgeted ? 'italic' : 'normal'
                                }}
                              >
                                {isUnbudgeted ? '未設定' : formatCurrency(item.budgetAmount)}
                              </TableCell>
                              <TableCell>{formatCurrency(item.categoryExpense)}</TableCell>
                              <TableCell 
                                sx={{
                                  color: isUnbudgeted ? '#f44336' : isOver ? '#f44336' : remaining <= item.budgetAmount * 0.1 ? '#ff9800' : '#4caf50',
                                  fontWeight: (isOver || isUnbudgeted) ? 'bold' : 'normal',
                                  backgroundColor: (isOver || isUnbudgeted) ? '#ffebee' : 'inherit'
                                }}
                              >
                                {isUnbudgeted ? `予算外: ${formatCurrency(item.categoryExpense)}` : formatCurrency(remaining)}
                              </TableCell>
                              <TableCell>
                                {isUnbudgeted ? (
                                  <Box sx={{ fontSize: '0.75rem', color: '#f44336', fontWeight: 'bold' }}>
                                    予算外
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                      sx={{
                                        width: 60,
                                        height: 8,
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: 4,
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: `${Math.min(usageRate, 100)}%`,
                                          height: '100%',
                                          backgroundColor: usageRate > 100 ? '#f44336' : usageRate > 80 ? '#ff9800' : '#4caf50',
                                          transition: 'width 0.3s ease'
                                        }}
                                      />
                                    </Box>
                                    <Box 
                                      sx={{
                                        fontSize: '0.75rem',
                                        color: usageRate > 100 ? '#f44336' : usageRate > 80 ? '#ff9800' : 'inherit',
                                        fontWeight: usageRate > 100 ? 'bold' : 'normal'
                                      }}
                                    >
                                      {usageRate.toFixed(1)}%
                                    </Box>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null;
            })()}
          </CardContent>
        </Card>
      </Box>

      {/* 画像表示ダイアログ */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          画像表示 ({currentImageIndex + 1} / {selectedImages.length})
          <IconButton onClick={handleCloseImageDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImages.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedImages[currentImageIndex]}
                alt={`Transaction image ${currentImageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          {selectedImages.length > 1 && (
            <>
              <Button onClick={handlePrevImage} variant="outlined">
                前の画像
              </Button>
              <Button onClick={handleNextImage} variant="outlined">
                次の画像
              </Button>
            </>
          )}
          <Button onClick={handleCloseImageDialog} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Report;