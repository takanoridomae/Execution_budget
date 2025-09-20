import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  ExpandMore
} from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { Transaction, SiteIncome, SiteExpense } from '../types';
import { useTransactionEdit } from '../hooks/useTransactionEdit';
import { useTransactionData } from '../hooks/useTransactionData';
import { useSiteDataEdit } from '../hooks/useSiteDataEdit';
import TransactionEditForm from './common/TransactionEditForm';
import SiteIncomeEditForm from './common/SiteIncomeEditForm';
import SiteExpenseEditForm from './common/SiteExpenseEditForm';
import { formatDisplayDate } from '../utils/dateUtils';
import { getImageFromLocalStorage } from '../utils/imageUtils';

const TransactionDetails: React.FC = () => {
  const { selectedDate } = useTransactions();
  const { sites } = useSites();
  const { categories } = useCategories();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const {
    editingTransaction,
    editForm,
    alert,
    startEdit,
    cancelEdit,
    updateEditForm,
    handleSave,
    handleDelete,
    handleImageFilesChange,
    removeNewImage,
    removeExistingImage,
    handleDocumentsChange,
    handleDocumentFilesSelect,
    handleDocumentRemove,
    removeExistingDocument
  } = useTransactionEdit();
  const { getDayTransactions, incomeTransactions, expenseTransactions, dayIncomes, dayExpenses } = useTransactionData();
  
  // 現場別データ編集機能
  const {
    editingIncome,
    incomeEditForm,
    startIncomeEdit,
    cancelIncomeEdit,
    updateIncomeEditForm,
    handleIncomeSave,
    handleIncomeDelete,
    handleIncomeImageSelect,
    handleIncomeImageRemove,
    handleIncomeExistingImageRemove,
    editingExpense,
    expenseEditForm,
    startExpenseEdit,
    cancelExpenseEdit,
    updateExpenseEditForm,
    handleExpenseSave,
    handleExpenseDelete,
    handleExpenseImageSelect,
    handleExpenseImageRemove,
    handleExpenseExistingImageRemove
  } = useSiteDataEdit();

  // 現場別入金データの表示
  const renderSiteIncomeItem = (income: SiteIncome) => {
    const site = sites.find(s => s.id === income.siteId);
    const siteName = site?.name || '不明な現場';
    
    return (
      <ListItem 
        key={income.id}
        sx={{ 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          mb: 1,
          backgroundColor: editingIncome?.id === income.id ? '#f5f5f5' : 'transparent'
        }}
      >
        {editingIncome?.id === income.id ? (
          // 編集モード
          <SiteIncomeEditForm
            income={income}
            editForm={incomeEditForm}
            onUpdateForm={updateIncomeEditForm}
            onSave={handleIncomeSave}
            onCancel={cancelIncomeEdit}
            onImageSelect={handleIncomeImageSelect}
            onImageRemove={handleIncomeImageRemove}
            onExistingImageRemove={handleIncomeExistingImageRemove}
          />
        ) : (
          // 表示モード
          <Box sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="h6">
                    ¥{income.amount.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={income.category} 
                    size="small" 
                    sx={{
                      backgroundColor: '#bbdefb',
                      color: '#1976d2',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  {income.content || '詳細なし'}
                </Typography>
                
                {/* ローカルストレージの画像 */}
                {income.imageIds && income.imageIds.length > 0 && (
                  <Box display="flex" gap={1} mt={1} mb={1}>
                    {income.imageIds.map((imageId, idx) => {
                      const imageData = getImageFromLocalStorage(income.id, imageId);
                      if (!imageData) return null;
                      return (
                        <img 
                          key={`income-local-${idx}`} 
                          src={imageData} 
                          alt={`入金画像-${idx}`} 
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} 
                        />
                      );
                    })}
                  </Box>
                )}
                
                {/* Firebase Storageの画像 */}
                {income.imageUrls && income.imageUrls.length > 0 && (
                  <Box display="flex" gap={1} mt={1} mb={1}>
                    {income.imageUrls.map((url, idx) => (
                      <img 
                        key={`income-url-${idx}`} 
                        src={url} 
                        alt={`入金画像-${idx}`} 
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} 
                      />
                    ))}
                  </Box>
                )}
                
                <Typography variant="caption" color="textSecondary">
                  現場: {siteName}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => {
                    console.log('🔧 現場入金編集ボタンクリック', income);
                    startIncomeEdit(income);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => {
                    console.log('🗑️ 現場入金削除ボタンクリック', income);
                    if (window.confirm('この入金記録を削除しますか？')) {
                      handleIncomeDelete(income.id);
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </ListItem>
    );
  };

  // 現場別支出データの表示
  const renderSiteExpenseItem = (expense: SiteExpense) => {
    const site = sites.find(s => s.id === expense.siteId);
    const siteName = site?.name || '不明な現場';
    const category = categories.find(c => c.id === expense.categoryId);
    const categoryName = category?.name || '不明なカテゴリー';
    
    return (
      <ListItem 
        key={expense.id}
        sx={{ 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          mb: 1,
          backgroundColor: editingExpense?.id === expense.id ? '#f5f5f5' : 'transparent'
        }}
      >
        {editingExpense?.id === expense.id ? (
          // 編集モード
          <SiteExpenseEditForm
            expense={expense}
            editForm={expenseEditForm}
            onUpdateForm={updateExpenseEditForm}
            onSave={handleExpenseSave}
            onCancel={cancelExpenseEdit}
            onImageSelect={handleExpenseImageSelect}
            onImageRemove={handleExpenseImageRemove}
            onExistingImageRemove={handleExpenseExistingImageRemove}
          />
        ) : (
          // 表示モード
          <Box sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="h6">
                    ¥{expense.amount.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={categoryName} 
                    size="small" 
                    sx={{
                      backgroundColor: '#ffcdd2',
                      color: '#d32f2f',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  {expense.content || '詳細なし'}
                </Typography>
                
                {/* ローカルストレージの画像 */}
                {expense.imageIds && expense.imageIds.length > 0 && (
                  <Box display="flex" gap={1} mt={1} mb={1}>
                    {expense.imageIds.map((imageId, idx) => {
                      const imageData = getImageFromLocalStorage(expense.id, imageId);
                      if (!imageData) return null;
                      return (
                        <img 
                          key={`expense-local-${idx}`} 
                          src={imageData} 
                          alt={`支出画像-${idx}`} 
                          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} 
                        />
                      );
                    })}
                  </Box>
                )}
                
                {/* Firebase Storageの画像 */}
                {expense.imageUrls && expense.imageUrls.length > 0 && (
                  <Box display="flex" gap={1} mt={1} mb={1}>
                    {expense.imageUrls.map((url, idx) => (
                      <img 
                        key={`expense-url-${idx}`} 
                        src={url} 
                        alt={`支出画像-${idx}`} 
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} 
                      />
                    ))}
                  </Box>
                )}
                
                <Typography variant="caption" color="textSecondary">
                  現場: {siteName}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => {
                    console.log('🔧 現場支出編集ボタンクリック', expense);
                    startExpenseEdit(expense);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => {
                    console.log('🗑️ 現場支出削除ボタンクリック', expense);
                    if (window.confirm('この支出記録を削除しますか？')) {
                      handleExpenseDelete(expense.id);
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </ListItem>
    );
  };

  // 取引項目の表示
  const renderTransactionItem = (transaction: Transaction) => {
    console.log('📋 取引項目レンダリング', {
      id: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      isEditing: editingTransaction?.id === transaction.id
    });
    
    return (
    <ListItem 
      key={transaction.id}
      sx={{ 
        border: '1px solid #ddd', 
        borderRadius: 1, 
        mb: 1,
        backgroundColor: editingTransaction?.id === transaction.id ? '#f5f5f5' : 'transparent'
      }}
    >
      {editingTransaction?.id === transaction.id ? (
        // 編集モード
        <TransactionEditForm
          transaction={transaction}
          editForm={editForm}
          onUpdateForm={updateEditForm}
          onSave={handleSave}
          onCancel={cancelEdit}
          onImageFilesChange={handleImageFilesChange}
          onRemoveNewImage={removeNewImage}
          onRemoveExistingImage={removeExistingImage}
          onDocumentsChange={handleDocumentsChange}
          onDocumentFilesSelect={handleDocumentFilesSelect}
          onDocumentRemove={handleDocumentRemove}
          onRemoveExistingDocument={removeExistingDocument}
        />
      ) : (
        // 表示モード
        <Box sx={{ width: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              {/* プライマリ情報 */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6">
                  ¥{transaction.amount.toLocaleString()}
                </Typography>
                <Chip 
                  label={transaction.category} 
                  size="small" 
                  sx={{
                    backgroundColor: transaction.type === 'income' ? '#bbdefb' : '#ffcdd2',
                    color: transaction.type === 'income' ? '#1976d2' : '#d32f2f',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              
              {/* セカンダリ情報 */}
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {transaction.content || '詳細なし'}
                </Typography>
                
                {/* ローカルストレージの画像 */}
                {transaction.imageIds && transaction.imageIds.length > 0 && (
                  <Box display="flex" gap={1} mt={1}>
                    {transaction.imageIds.map((imageId, idx) => {
                      const imageData = getImageFromLocalStorage(transaction.id, imageId);
                      if (!imageData) return null;
                      return (
                        <img key={`local-${idx}`} src={imageData} alt={`tx-img-${idx}`} style={{ width: 60, height: 60, objectFit: 'cover' }} />
                      );
                    })}
                  </Box>
                )}
                
                {/* 後方互換性: Firebase Storageの画像 */}
                {transaction.imageUrls && transaction.imageUrls.length > 0 && (
                  <Box display="flex" gap={1} mt={1}>
                    {transaction.imageUrls.map((url, idx) => (
                      <img key={`url-${idx}`} src={url} alt={`tx-url-${idx}`} style={{ width: 60, height: 60, objectFit: 'cover' }} />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => {
                  console.log('🔧 編集ボタンクリック', transaction);
                  startEdit(transaction);
                }}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleDelete(transaction.id)}
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </ListItem>
  );
  };

  if (!selectedDate) {
    return (
      <Paper 
        elevation={isMobile ? 0 : 2} 
        sx={{ 
          p: isMobile ? 1 : 3, 
          mt: isMobile ? 0 : 2,
          border: isMobile ? 'none' : undefined,
          boxShadow: isMobile ? 'none' : undefined 
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          取引明細
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
          カレンダーから日付を選択してください
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={isMobile ? 0 : 2} 
      sx={{ 
        p: isMobile ? 1 : 3, 
        mt: isMobile ? 0 : 2,
        border: isMobile ? 'none' : undefined,
        boxShadow: isMobile ? 'none' : undefined 
      }}
    >
      <Typography 
        variant={isMobile ? "h6" : "h6"} 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          fontSize: isMobile ? '1.1rem' : undefined
        }}
      >
        {formatDisplayDate(selectedDate)}の取引明細
      </Typography>

      {alert && (
        <Alert severity={alert?.type} sx={{ mb: 2 }}>
          {alert?.message}
        </Alert>
      )}

      {getDayTransactions.length === 0 && dayIncomes.length === 0 && dayExpenses.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
          この日の取引記録はありません
        </Typography>
      ) : (
        <Box>
          {/* 現場別入金セクション */}
          {dayIncomes.length > 0 && (
            <Accordion 
              defaultExpanded
              sx={{ 
                backgroundColor: '#e3f2fd',
                '&:before': {
                  display: 'none',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px !important',
                mb: 1
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ backgroundColor: '#bbdefb', borderRadius: '8px 8px 0 0' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    入金 ({dayIncomes.length}件)
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 1, 
                      color: '#1976d2',
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      wordBreak: 'keep-all',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    ¥{dayIncomes.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ width: '100%' }}>
                  {dayIncomes.map(renderSiteIncomeItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 従来の入金セクション（後方互換性） */}
          {incomeTransactions.length > 0 && (
            <Accordion 
              defaultExpanded
              sx={{ 
                backgroundColor: '#e3f2fd',
                '&:before': {
                  display: 'none',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px !important',
                mb: 1
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ backgroundColor: '#bbdefb', borderRadius: '8px 8px 0 0' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    入金 ({incomeTransactions.length}件)
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, color: '#1976d2' }}>
                    ¥{incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ width: '100%' }}>
                  {incomeTransactions.map(renderTransactionItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 現場別支出セクション */}
          {dayExpenses.length > 0 && (
            <Accordion 
              defaultExpanded 
              sx={{ 
                mt: dayIncomes.length > 0 || incomeTransactions.length > 0 ? 1 : 0,
                backgroundColor: '#ffebee',
                '&:before': {
                  display: 'none',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px !important'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ backgroundColor: '#ffcdd2', borderRadius: '8px 8px 0 0' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingDown sx={{ color: '#d32f2f' }} />
                  <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    支出 ({dayExpenses.length}件)
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      ml: 1, 
                      color: '#d32f2f',
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      wordBreak: 'keep-all',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    ¥{dayExpenses.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ width: '100%' }}>
                  {dayExpenses.map(renderSiteExpenseItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 従来の支出セクション（後方互換性） */}
          {expenseTransactions.length > 0 && (
            <Accordion 
              defaultExpanded 
              sx={{ 
                mt: incomeTransactions.length > 0 || dayIncomes.length > 0 || dayExpenses.length > 0 ? 1 : 0,
                backgroundColor: '#ffebee',
                '&:before': {
                  display: 'none',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px !important'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ backgroundColor: '#ffcdd2', borderRadius: '8px 8px 0 0' }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingDown sx={{ color: '#d32f2f' }} />
                  <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    支出 ({expenseTransactions.length}件)
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, color: '#d32f2f' }}>
                    ¥{expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ width: '100%' }}>
                  {expenseTransactions.map(renderTransactionItem)}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TransactionDetails;
