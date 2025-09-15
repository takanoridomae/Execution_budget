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
  ListItemText,
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
  Edit, 
  Delete,
  ListAlt
} from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction } from '../types';
import { useTransactionEdit } from '../hooks/useTransactionEdit';
import { useTransactionData } from '../hooks/useTransactionData';
import TransactionEditForm from './common/TransactionEditForm';
import { formatDisplayDate } from '../utils/dateUtils';

const TransactionMenu: React.FC = () => {
  const { selectedDate, setShowTransactionForm, showTransactionDetailsModal, setShowTransactionDetailsModal } = useTransactions();
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
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
    removeExistingImage
  } = useTransactionEdit();
  const { dayData, getTransactionsByType } = useTransactionData();
  


  // モーダルを開く
  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowTransactionDetailsModal(true);
    console.log('TransactionMenu - Modal opened, showTransactionDetailsModal:', true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowTransactionDetailsModal(false);
    cancelEdit();
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
        {/* 収入 */}
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
            <CardContent sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <TrendingUp sx={{ color: '#4caf50', fontSize: isMobile ? 24 : 32 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                収入
              </Typography>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ fontWeight: 'bold', color: '#4caf50' }}
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
            <CardContent sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <TrendingDown sx={{ color: '#f44336', fontSize: isMobile ? 24 : 32 }} />
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                支出
              </Typography>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ fontWeight: 'bold', color: '#f44336' }}
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
            <CardContent sx={{ textAlign: 'center', p: isMobile ? 1 : 2 }}>
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
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 'bold', 
                  color: dayData.balance >= 0 ? '#2196f3' : '#ff9800'
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
              {formatDisplayDate(selectedDate)}の{modalType === 'income' ? '収入' : '支出'}詳細
            </Typography>
            <IconButton onClick={closeModal}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {alert && (
            <Alert severity={alert.type} sx={{ mb: 2 }}>
              {alert.message}
            </Alert>
          )}

          <List>
            {getTransactionsByType(modalType).map((transaction) => (
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
                  />
                ) : (
                  // 表示モード
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box flex={1}>
                        {/* プライマリ情報 */}
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="h6">
                            ¥{transaction.amount.toLocaleString()}
                          </Typography>
                          <Chip 
                            label={transaction.category} 
                            size="small" 
                            color={modalType === 'income' ? 'success' : 'error'}
                          />
                        </Box>
                        
                        {/* セカンダリ情報 */}
                        <Typography variant="body2" color="textSecondary">
                          {transaction.content || '詳細なし'}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => startEdit(transaction)}
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
            ))}
            
            {getTransactionsByType(modalType).length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                {modalType === 'income' ? '収入' : '支出'}の記録がありません
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