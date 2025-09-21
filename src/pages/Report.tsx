import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardHeader, CardContent, Button, FormControl, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, InputLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Photo, Close, Article } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSites } from '../contexts/SiteContext';
import { getImageFromLocalStorage } from '../utils/imageUtils';
import { formatCurrency } from '../utils/numberUtils';

interface ChartDataItem {
  name: string;
  categoryId: string;
  budget: number;
  actual: number;
  達成率: number;
}

interface PieChartDataItem {
  name: string;
  value: number;
  実績額: number;
  予算額: number;
  未使用額: number;
  達成率: number;
}

const Report: React.FC = () => {
  const { siteExpenses, siteIncomes } = useTransactions();
  const { categories, getActiveCategoriesBySite } = useCategories();
  const { sites } = useSites();

  // 検索フィルター用状態
  const [filterSiteId, setFilterSiteId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(''); // 空文字=すべて
  const [filterMonth, setFilterMonth] = useState<string>(''); // 空文字=すべて
  
  // 支出データから動的に年月オプションを生成
  const availableYearMonths = useMemo(() => {
    const yearMonthSet = new Set<string>();
    
    // 支出データから年月を抽出
    (siteExpenses ?? []).forEach(expense => {
      if (expense.date) {
        const yearMonth = expense.date.substring(0, 7); // "YYYY-MM" 形式
        yearMonthSet.add(yearMonth);
      }
    });
    
    // 入金データからも年月を抽出
    (siteIncomes ?? []).forEach(income => {
      if (income.date) {
        const yearMonth = income.date.substring(0, 7); // "YYYY-MM" 形式
        yearMonthSet.add(yearMonth);
      }
    });
    
    // 現在の年月も含める
    const currentDate = new Date();
    const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    yearMonthSet.add(currentYearMonth);
    
    // ソートして配列に変換
    return Array.from(yearMonthSet).sort().reverse(); // 新しい順
  }, [siteExpenses, siteIncomes]);
  
  // 年オプションを生成
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    availableYearMonths.forEach(yearMonth => {
      const year = parseInt(yearMonth.split('-')[0]);
      years.add(year);
    });
    return Array.from(years).sort().reverse(); // 新しい順
  }, [availableYearMonths]);
  
  // 選択された現場に対応するカテゴリーを取得
  const availableCategories = useMemo(() => {
    if (!filterSiteId) {
      // 現場が選択されていない場合は全てのカテゴリー
      return categories.filter(cat => cat.isActive);
    }
    // 選択された現場のアクティブなカテゴリーのみ
    return getActiveCategoriesBySite(filterSiteId);
  }, [filterSiteId, categories, getActiveCategoriesBySite]);
  
  // 現場フィルターが変更された時にカテゴリーフィルターをリセット
  useEffect(() => {
    if (filterSiteId && !availableCategories.some(cat => cat.id === filterCategoryId)) {
      setFilterCategoryId('');
    }
  }, [filterSiteId, availableCategories, filterCategoryId]);

  // 日付ソート用状態
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc'|'desc'>('asc');
  
  // 画像表示用状態
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 書類表示用状態
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  
  const toggleExpenseSort = () => setExpenseSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  
  // 現場別の色を決定する関数
  const getSiteColor = (siteId: string) => {
    const siteColors = [
      { bg: '#e3f2fd', color: '#0d47a1' }, // 青系
      { bg: '#e8f5e8', color: '#1b5e20' }, // 緑系
      { bg: '#fff3e0', color: '#e65100' }, // オレンジ系
      { bg: '#fce4ec', color: '#880e4f' }, // ピンク系
      { bg: '#f3e5f5', color: '#4a148c' }, // 紫系
      { bg: '#e0f2f1', color: '#00695c' }, // ティール系
      { bg: '#fff8e1', color: '#ff6f00' }, // アンバー系
      { bg: '#efebe9', color: '#3e2723' }, // ブラウン系
    ];
    
    // siteIdのハッシュを使って色を決定
    let hash = 0;
    for (let i = 0; i < siteId.length; i++) {
      hash = siteId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % siteColors.length;
    return siteColors[index];
  };
  
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
  
  // 書類表示ハンドラー
  const handleDocumentClick = (transaction: any) => {
    const documents: string[] = [];
    
    // Firebase Storageの書類を追加
    if (transaction.documentUrls) {
      documents.push(...transaction.documentUrls);
    }
    
    // ローカルストレージの書類は今回は簡略化（実装時は documentUtils を使用）
    
    setSelectedDocuments(documents);
    setCurrentDocumentIndex(0);
    setDocumentDialogOpen(true);
  };

  const handleCloseDocumentDialog = () => {
    setDocumentDialogOpen(false);
    setSelectedDocuments([]);
    setCurrentDocumentIndex(0);
  };

  const handlePrevDocument = () => {
    setCurrentDocumentIndex((prev) => (prev > 0 ? prev - 1 : selectedDocuments.length - 1));
  };

  const handleNextDocument = () => {
    setCurrentDocumentIndex((prev) => (prev < selectedDocuments.length - 1 ? prev + 1 : 0));
  };
  
  const sortedExpenseTx = useMemo(() => {
    // 全支出データから検索
    const expenses = siteExpenses ?? [];
    
    // フィルターを適用
    const filteredExpenses = expenses.filter((expense) => {
      // 年フィルター
      if (filterYear) {
        const expenseYear = expense.date.substring(0, 4);
        if (expenseYear !== filterYear) {
          return false;
        }
      }
      
      // 月フィルター
      if (filterMonth) {
        const expenseMonth = expense.date.substring(5, 7);
        if (expenseMonth !== filterMonth.padStart(2, '0')) {
          return false;
        }
      }
      
      // 現場フィルター
      if (filterSiteId && expense.siteId !== filterSiteId) {
        return false;
      }
      
      // カテゴリーフィルター
      if (filterCategoryId && expense.categoryId !== filterCategoryId) {
        return false;
      }
      
      return true;
    });
    
    const sorted = [...filteredExpenses].sort((a, b) => a.date.localeCompare(b.date));
    return expenseSortOrder === 'asc' ? sorted : [...sorted].reverse();
  }, [siteExpenses, expenseSortOrder, filterYear, filterMonth, filterSiteId, filterCategoryId]);
  
  // 入金明細のフィルタリング
  const sortedIncomeTx = useMemo(() => {
    // 全入金データから検索
    const incomes = siteIncomes ?? [];
    
    // フィルターを適用
    const filteredIncomes = incomes.filter((income) => {
      // 年フィルター
      if (filterYear) {
        const incomeYear = income.date.substring(0, 4);
        if (incomeYear !== filterYear) {
          return false;
        }
      }
      
      // 月フィルター
      if (filterMonth) {
        const incomeMonth = income.date.substring(5, 7);
        if (incomeMonth !== filterMonth.padStart(2, '0')) {
          return false;
        }
      }
      
      // 現場フィルター
      if (filterSiteId && income.siteId !== filterSiteId) {
        return false;
      }
      
      return true;
    });
    
    const sorted = [...filteredIncomes].sort((a, b) => a.date.localeCompare(b.date));
    return expenseSortOrder === 'asc' ? sorted : [...sorted].reverse();
  }, [siteIncomes, expenseSortOrder, filterYear, filterMonth, filterSiteId]);
  
  // 支出の検索結果サマリー情報を計算
  const expenseSummary = useMemo(() => {
    const totalAmount = sortedExpenseTx.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = sortedExpenseTx.length;
    
    // 現場別集計
    const bySite: Record<string, { amount: number; count: number; siteName: string; siteId: string }> = {};
    sortedExpenseTx.forEach(expense => {
      const site = sites.find(s => s.id === expense.siteId);
      const siteName = site?.name || '不明な現場';
      const key = expense.siteId;
      
      if (!bySite[key]) {
        bySite[key] = { amount: 0, count: 0, siteName, siteId: expense.siteId };
      }
      bySite[key].amount += expense.amount;
      bySite[key].count += 1;
    });
    
    // カテゴリー別集計
    const byCategory: Record<string, { amount: number; count: number; categoryName: string }> = {};
    sortedExpenseTx.forEach(expense => {
      const category = categories.find(c => c.id === expense.categoryId);
      const categoryName = category?.name || '不明なカテゴリー';
      const key = expense.categoryId;
      
      if (!byCategory[key]) {
        byCategory[key] = { amount: 0, count: 0, categoryName };
      }
      byCategory[key].amount += expense.amount;
      byCategory[key].count += 1;
    });
    
    return {
      totalAmount,
      totalCount,
      bySite: Object.values(bySite).sort((a, b) => b.amount - a.amount),
      byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount)
    };
  }, [sortedExpenseTx, sites, categories]);
  
  // 入金の検索結果サマリー情報を計算
  const incomeSummary = useMemo(() => {
    const totalAmount = sortedIncomeTx.reduce((sum, income) => sum + income.amount, 0);
    const totalCount = sortedIncomeTx.length;
    
    // 現場別集計
    const bySite: Record<string, { amount: number; count: number; siteName: string; siteId: string }> = {};
    sortedIncomeTx.forEach(income => {
      const site = sites.find(s => s.id === income.siteId);
      const siteName = site?.name || '不明な現場';
      const key = income.siteId;
      
      if (!bySite[key]) {
        bySite[key] = { amount: 0, count: 0, siteName, siteId: income.siteId };
      }
      bySite[key].amount += income.amount;
      bySite[key].count += 1;
    });
    
    return {
      totalAmount,
      totalCount,
      bySite: Object.values(bySite).sort((a, b) => b.amount - a.amount)
    };
  }, [sortedIncomeTx, sites]);

  // 横棒グラフ用データ：選択された現場のカテゴリー別予算と実績
  const chartData = useMemo((): ChartDataItem[] => {
    // 現場が選択されていない場合は空配列
    if (!filterSiteId) {
      return [];
    }

    // 選択された現場のアクティブなカテゴリーを取得
    const siteCategories = getActiveCategoriesBySite(filterSiteId);
    
    // カテゴリー別の実績を計算（フィルター条件を適用）
    const categoryExpenses: Record<string, number> = {};
    sortedExpenseTx.forEach(expense => {
      if (expense.siteId === filterSiteId) {
        categoryExpenses[expense.categoryId] = (categoryExpenses[expense.categoryId] || 0) + expense.amount;
      }
    });

    // グラフ用データを作成
    const data = siteCategories.map(category => {
      const budgetAmount = Number(category.budgetAmount) || 0;
      const actualAmount = Number(categoryExpenses[category.id]) || 0;
      
      return {
        name: category.name,
        categoryId: category.id,
        budget: budgetAmount,
        actual: actualAmount,
        達成率: budgetAmount > 0 
          ? Math.round((actualAmount / budgetAmount) * 100)
          : 0
      };
    });

    // 予算金額順で降順ソート
    return data.sort((a, b) => b.budget - a.budget);
  }, [filterSiteId, getActiveCategoriesBySite, sortedExpenseTx]);

  // カテゴリー毎の円グラフ用データ：予算100%として実績%を表示
  const pieChartDataList = useMemo((): PieChartDataItem[][] => {
    return chartData.map(category => {
      const 実績率 = Math.min(category.達成率, 100); // 100%以上は100%でキャップ
      const 未使用率 = Math.max(100 - category.達成率, 0); // 未使用分

      // 予算を100%として、実績%と未使用%のデータを作成
      const pieData: PieChartDataItem[] = [
        {
          name: '実績',
          value: 実績率,
          実績額: category.actual,
          予算額: category.budget,
          未使用額: Math.max(category.budget - category.actual, 0),
          達成率: category.達成率
        },
        {
          name: '未使用',
          value: 未使用率,
          実績額: category.actual,
          予算額: category.budget,
          未使用額: Math.max(category.budget - category.actual, 0),
          達成率: category.達成率
        }
      ];

      // 100%を超過している場合は、超過分も表示
      if (category.達成率 > 100) {
        const 超過率 = category.達成率 - 100;
        pieData.push({
          name: '超過',
          value: 超過率,
          実績額: category.actual,
          予算額: category.budget,
          未使用額: 0,
          達成率: category.達成率
        });
      }

      return pieData;
    });
  }, [chartData]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        {/* 検索フィルター */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel shrink={true}>年</InputLabel>
            <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} label="年">
              <MenuItem value="">すべて</MenuItem>
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y.toString()}>{y}年</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel shrink={true}>月</InputLabel>
            <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} label="月">
              <MenuItem value="">すべて</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <MenuItem key={m} value={m.toString()}>{m}月</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel shrink={true}>現場</InputLabel>
            <Select value={filterSiteId} onChange={(e) => setFilterSiteId(e.target.value)} label="現場">
              <MenuItem value="">すべての現場</MenuItem>
              {sites.filter(site => site.isActive).map((site) => (
                <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel shrink={true}>カテゴリー</InputLabel>
            <Select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} label="カテゴリー">
              <MenuItem value="">すべてのカテゴリー</MenuItem>
              {availableCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 検索結果サマリー */}
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardHeader title="検索結果サマリー" subheader={`支出${expenseSummary.totalCount}件 / 入金${incomeSummary.totalCount}件`} />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* 支出サマリー */}
              <Box>
                <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 2, color: '#f44336' }}>
                  支出合計: {formatCurrency(expenseSummary.totalAmount)}
                </Box>
                
                {/* 支出現場別集計 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>支出現場別集計</Box>
                  {expenseSummary.bySite.map((site) => {
                    const siteColor = getSiteColor(site.siteId);
                    return (
                      <Box key={site.siteName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Box>{site.siteName}</Box>
                        <Box sx={{ 
                          backgroundColor: siteColor.bg, 
                          color: siteColor.color, 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {formatCurrency(site.amount)} ({site.count}件)
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                
                {/* カテゴリー別集計 */}
                <Box>
                  <Box sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>カテゴリー別集計</Box>
                  {expenseSummary.byCategory.map((category) => (
                    <Box key={category.categoryName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Box>{category.categoryName}</Box>
                      <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {formatCurrency(category.amount)} ({category.count}件)
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              {/* 入金サマリー */}
              <Box>
                <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
                  入金合計: {formatCurrency(incomeSummary.totalAmount)}
                </Box>
                
                {/* 入金現場別集計 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>入金現場別集計</Box>
                  {incomeSummary.bySite.map((site) => {
                    const siteColor = getSiteColor(site.siteId);
                    return (
                      <Box key={site.siteName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Box>{site.siteName}</Box>
                        <Box sx={{ 
                          backgroundColor: siteColor.bg, 
                          color: siteColor.color, 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}>
                          {formatCurrency(site.amount)} ({site.count}件)
                        </Box>
                      </Box>
                    );
                  })}
            </Box>
                
                {/* 収支差額 */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>収支差額</Box>
                  <Box sx={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: (incomeSummary.totalAmount - expenseSummary.totalAmount) >= 0 ? '#4caf50' : '#f44336'
                  }}>
                    {formatCurrency(incomeSummary.totalAmount - expenseSummary.totalAmount)}
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* カテゴリー別予算・実績グラフ */}
      {filterSiteId && (
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardHeader 
              title={`${sites.find(s => s.id === filterSiteId)?.name || '選択現場'} - カテゴリー別予算と実績`}
              subheader={
                chartData.length > 0
                  ? `予算合計: ${formatCurrency(chartData.reduce((sum: number, item: any) => sum + item.budget, 0))} / 実績合計: ${formatCurrency(chartData.reduce((sum: number, item: any) => sum + item.actual, 0))}`
                  : 'カテゴリーデータがありません'
              }
            />
            <CardContent>
              {chartData.length > 0 ? (
                <>
                  
                  {/* カテゴリー毎の円グラフ表示 */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: 3,
                    width: '100%'
                  }}>
                    {chartData.map((category, categoryIndex) => {
                      const pieData = pieChartDataList[categoryIndex];
                      const 色配列 = ['#4caf50', '#ef9a9a', '#f44336']; // 実績、未使用、超過
                      
                      return (
                        <Box key={category.categoryId} sx={{ 
                          textAlign: 'center',
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          p: 2
                        }}>
                          <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 1.5 }}>
                            {category.name}
                          </Box>
                          <Box sx={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, value }) => (value && value > 0) ? `${value.toFixed(1)}%` : ''}
                                  outerRadius={70}
                                  fill="#8884d8"
                                  dataKey="value"
                                  startAngle={90}
                                  endAngle={-270}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={色配列[index % 色配列.length]} 
                                    />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload as PieChartDataItem;
                                      return (
                                        <Paper sx={{ p: 2, boxShadow: 3 }}>
                                          <Box sx={{ fontWeight: 'bold', mb: 1 }}>{category.name}</Box>
                                          <Box>予算: {formatCurrency(data.予算額)}</Box>
                                          <Box>実績: {formatCurrency(data.実績額)}</Box>
                                          <Box>未使用: {formatCurrency(data.未使用額)}</Box>
                                          <Box sx={{ 
                                            color: data.達成率 === 100 ? '#4caf50' : data.達成率 > 100 ? '#f44336' : '#4caf50',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                          }}>
                                            進捗率: {data.達成率}%
                                            {data.達成率 === 100 && (
                                              <Box sx={{ 
                                                fontSize: '0.8rem', 
                                                backgroundColor: '#4caf50', 
                                                color: 'white', 
                                                px: 0.5, 
                                                py: 0.2, 
                                                borderRadius: 0.5,
                                                ml: 0.5
                                              }}>
                                                完了
                                              </Box>
                                            )}
                                          </Box>
                                        </Paper>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                          <Box sx={{ mt: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                            予算: {formatCurrency(category.budget)} / 実績: {formatCurrency(category.actual)}
                          </Box>
                          <Box sx={{ 
                            mt: 0.5, 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            color: category.達成率 === 100 ? '#4caf50' : category.達成率 > 100 ? '#f44336' : '#ff9800'
                          }}>
                            進捗率: {category.達成率}%
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ fontSize: '1.1rem', mb: 2 }}>
                    選択された現場にカテゴリーが設定されていません
                  </Box>
                  <Box sx={{ color: 'text.secondary' }}>
                    カテゴリー管理画面で現場のカテゴリーを追加してください
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
        <Card>
          <CardHeader title="支出明細" subheader="支出の詳細を日付・現場・カテゴリ・金額・内容で表示" />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="outlined" size="small" onClick={toggleExpenseSort}>
                日付: {expenseSortOrder === 'asc' ? '昇順' : '降順'}
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="支出明細テーブル">
                <TableHead>
                  <TableRow>
                    <TableCell>日付</TableCell>
                    <TableCell>現場</TableCell>
                    <TableCell>カテゴリ</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>内容（詳細）</TableCell>
                    <TableCell>写真リンク</TableCell>
                    <TableCell>書類リンク</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedExpenseTx.map((t) => {
                    const category = categories.find(c => c.id === t.categoryId);
                    const categoryName = category?.name || '不明なカテゴリー';
                    const site = sites.find(s => s.id === t.siteId);
                    const siteName = site?.name || '不明な現場';
                    
                    const siteColor = getSiteColor(t.siteId);
                    
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{siteName}</TableCell>
                        <TableCell>{categoryName}</TableCell>
                        <TableCell sx={{ backgroundColor: siteColor.bg, color: siteColor.color, fontWeight: 'bold' }}>{formatCurrency(t.amount)}</TableCell>
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
                        <TableCell>
                          {((t.documentIds && t.documentIds.length > 0) || (t.documentUrls && t.documentUrls.length > 0)) ? (
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleDocumentClick(t)}
                            >
                              <Article />
                            </IconButton>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader title="入金明細" subheader="入金の詳細を日付・現場・金額・内容で表示" />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="outlined" size="small" onClick={toggleExpenseSort}>
                日付: {expenseSortOrder === 'asc' ? '昇順' : '降順'}
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="入金明細テーブル">
                <TableHead>
                  <TableRow>
                    <TableCell>日付</TableCell>
                    <TableCell>現場</TableCell>
                    <TableCell>カテゴリ</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>内容（詳細）</TableCell>
                    <TableCell>写真リンク</TableCell>
                    <TableCell>書類リンク</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedIncomeTx.map((t) => {
                    const site = sites.find(s => s.id === t.siteId);
                    const siteName = site?.name || '不明な現場';
                    const siteColor = getSiteColor(t.siteId);
                    
                    return (
                      <TableRow key={t.id}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{siteName}</TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell sx={{ backgroundColor: siteColor.bg, color: siteColor.color, fontWeight: 'bold' }}>{formatCurrency(t.amount)}</TableCell>
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
                        <TableCell>
                          {((t.documentIds && t.documentIds.length > 0) || (t.documentUrls && t.documentUrls.length > 0)) ? (
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleDocumentClick(t)}
                            >
                              <Article />
                            </IconButton>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
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
                alt={`表示中 ${currentImageIndex + 1}`}
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

      {/* 書類表示ダイアログ */}
      <Dialog
        open={documentDialogOpen}
        onClose={handleCloseDocumentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          書類表示 ({currentDocumentIndex + 1} / {selectedDocuments.length})
          <IconButton onClick={handleCloseDocumentDialog}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedDocuments.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <iframe
                src={selectedDocuments[currentDocumentIndex]}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none'
                }}
                title={`Document ${currentDocumentIndex + 1}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2 }}>
          {selectedDocuments.length > 1 && (
            <>
              <Button onClick={handlePrevDocument} variant="outlined">
                前の書類
              </Button>
              <Button onClick={handleNextDocument} variant="outlined">
                次の書類
              </Button>
            </>
          )}
          <Button onClick={handleCloseDocumentDialog} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Report;