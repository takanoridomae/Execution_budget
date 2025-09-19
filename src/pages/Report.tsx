import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardHeader, CardContent, Button, FormControl, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, InputLabel, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Photo, Close, Article } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSites } from '../contexts/SiteContext';
import { getImageFromLocalStorage } from '../utils/imageUtils';
import { formatCurrency } from '../utils/numberUtils';


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
    
    // 収入データからも年月を抽出
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
  
  // 収入明細のフィルタリング
  const sortedIncomeTx = useMemo(() => {
    // 全収入データから検索
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
  
  // 収入の検索結果サマリー情報を計算
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
          <CardHeader title="検索結果サマリー" subheader={`支出${expenseSummary.totalCount}件 / 収入${incomeSummary.totalCount}件`} />
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
              
              {/* 収入サマリー */}
              <Box>
                <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
                  収入合計: {formatCurrency(incomeSummary.totalAmount)}
                </Box>
                
                {/* 収入現場別集計 */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 1 }}>収入現場別集計</Box>
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
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
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
          <CardHeader title="収入明細" subheader="収入の詳細を日付・現場・金額・内容で表示" />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button variant="outlined" size="small" onClick={toggleExpenseSort}>
                日付: {expenseSortOrder === 'asc' ? '昇順' : '降順'}
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="収入明細テーブル">
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