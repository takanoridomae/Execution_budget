import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  IconButton,
  Chip,
  Alert,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance, 
  Close,
  ListAlt
} from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { SiteIncome, SiteExpense } from '../types';
import { useTransactionData } from '../hooks/useTransactionData';
import { formatDisplayDate } from '../utils/dateUtils';

const TransactionMenu: React.FC = () => {
  const { 
    selectedDate, 
    setShowTransactionForm, 
    showTransactionDetailsModal, 
    setShowTransactionDetailsModal,
    siteIncomes,
    siteExpenses 
  } = useTransactions();
  const { sites } = useSites();
  const { categories } = useCategories();
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { dayData } = useTransactionData();
  
  // 現場別データから該当日の入金・支出を取得
  const getSiteTransactionsByType = (type: 'income' | 'expense') => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (type === 'income') {
      return siteIncomes.filter(income => income.date === dateKey);
    } else {
      return siteExpenses.filter(expense => expense.date === dateKey);
    }
  };

  // モーダルを開く
  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowTransactionDetailsModal(true);
    console.log('TransactionMenu - Modal opened, showTransactionDetailsModal:', true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowTransactionDetailsModal(false);
    console.log('TransactionMenu - Modal closed, showTransactionDetailsModal:', false);
  };



  return (
    <Paper 
      elevation={isMobile ? 0 : 2} 
      sx={{ 
        p: isMobile ? 1 : 3,
        border: isMobile ? 'none' : undefined,
        boxShadow: isMobile ? 'none' : undefined 
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          mb: isMobile ? 2 : 3, 
          textAlign: 'center',
          fontSize: isMobile ? '1.1rem' : undefined
        }}
      >
        {formatDisplayDate(selectedDate)}の収支
      </Typography>
      
      <Grid container spacing={2}>
        {/* 入金 */}
        <Grid size={4}>
          <Card 
            sx={{ 
              backgroundColor: '#e8f5e8',
              border: '2px solid #4caf50',
              borderRadius: 2,
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#d7f0d7'
              }
            }}
            onClick={() => openModal('income')}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              p: isMobile ? 0.5 : 1.5,
              '&:last-child': { pb: isMobile ? 0.5 : 1.5 }
            }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <TrendingUp sx={{ color: '#4caf50', fontSize: isMobile ? 24 : 32 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                入金
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#4caf50',
                  fontSize: isMobile ? '0.875rem' : '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ¥{dayData.income.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 支出 */}
        <Grid size={4}>
          <Card 
            sx={{ 
              backgroundColor: '#fce8e8',
              border: '2px solid #f44336',
              borderRadius: 2,
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#fad7d7'
              }
            }}
            onClick={() => openModal('expense')}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              p: isMobile ? 0.5 : 1.5,
              '&:last-child': { pb: isMobile ? 0.5 : 1.5 }
            }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <TrendingDown sx={{ color: '#f44336', fontSize: isMobile ? 24 : 32 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                支出
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#f44336',
                  fontSize: isMobile ? '0.875rem' : '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ¥{dayData.expense.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 残高 */}
        <Grid size={4}>
          <Card 
            sx={{ 
              backgroundColor: dayData.balance >= 0 ? '#e8f4ff' : '#fff3e0',
              border: `2px solid ${dayData.balance >= 0 ? '#2196f3' : '#ff9800'}`,
              borderRadius: 2,
              height: '100%'
            }}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              p: isMobile ? 0.5 : 1.5,
              '&:last-child': { pb: isMobile ? 0.5 : 1.5 }
            }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <AccountBalance sx={{ 
                  color: dayData.balance >= 0 ? '#2196f3' : '#ff9800', 
                  fontSize: isMobile ? 24 : 32 
                }} />
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                残高
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  fontWeight: 'bold', 
                  color: dayData.balance >= 0 ? '#2196f3' : '#ff9800',
                  fontSize: isMobile ? '0.875rem' : '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {dayData.balance >= 0 ? '+' : ''}¥{dayData.balance.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 内訳明細ボタン */}
      <Box sx={{ mt: isMobile ? 2 : 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          startIcon={<ListAlt />}
          onClick={() => setShowTransactionForm(true)}
          sx={{
            backgroundColor: '#2196f3',
            '&:hover': {
              backgroundColor: '#1976d2'
            },
            px: isMobile ? 3 : 4,
            py: isMobile ? 1 : 1.5,
            borderRadius: 2,
            fontWeight: 'bold',
            fontSize: isMobile ? '0.875rem' : undefined
          }}
        >
          内訳明細
        </Button>
      </Box>

      {/* 取引詳細モーダル */}
      <Dialog 
        open={showTransactionDetailsModal} 
        onClose={closeModal} 
        maxWidth="md" 
        fullWidth
        sx={{
          zIndex: 8000, // 新規入力フォームより下に
          '& .MuiDialog-paper': {
            zIndex: 8000
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {formatDisplayDate(selectedDate)}の{modalType === 'income' ? '入金' : '支出'}詳細
            </Typography>
            <IconButton onClick={closeModal}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {getSiteTransactionsByType(modalType).map((transaction) => {
              // 現場名を取得
              const site = sites.find(s => s.id === transaction.siteId);
              const siteName = site?.name || '不明な現場';
              
              // カテゴリー名を取得
              let categoryName = '';
              if (modalType === 'income') {
                categoryName = (transaction as SiteIncome).category; // '入金'
              } else {
                const category = categories.find(c => c.id === (transaction as SiteExpense).categoryId);
                categoryName = category?.name || '不明なカテゴリー';
              }
              
              return (
                <ListItem 
                  key={transaction.id}
                  sx={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    mb: 1,
                    backgroundColor: 'transparent'
                  }}
                >
                  {/* 表示モード（編集機能は一時的に無効化） */}
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box flex={1}>
                        {/* プライマリ情報 */}
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography 
                            variant="h6"
                            sx={{ 
                              fontSize: '1.1rem',
                              lineHeight: 1.2,
                              wordBreak: 'keep-all',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            ¥{transaction.amount.toLocaleString()}
                          </Typography>
                          <Chip 
                            label={categoryName} 
                            size="small" 
                            color={modalType === 'income' ? 'success' : 'error'}
                          />
                        </Box>
                        
                        {/* セカンダリ情報 */}
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {transaction.content || '詳細なし'}
                        </Typography>
                        
                        {/* 現場情報 */}
                        <Typography variant="caption" color="textSecondary">
                          現場: {siteName}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        {/* 編集・削除ボタンは一時的に無効化
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => startEdit(transaction)}
                          disabled
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(transaction.id)}
                          disabled
                        >
                          <Delete />
                        </IconButton>
                        */}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              );
            })}
            
            {getSiteTransactionsByType(modalType).length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                {modalType === 'income' ? '入金' : '支出'}の記録がありません
              </Typography>
            )}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeModal}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TransactionMenu;