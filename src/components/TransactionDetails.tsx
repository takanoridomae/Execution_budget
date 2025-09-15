import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Divider,
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
import { Transaction } from '../types';
import { useTransactionEdit } from '../hooks/useTransactionEdit';
import { useTransactionData } from '../hooks/useTransactionData';
import TransactionEditForm from './common/TransactionEditForm';
import { formatDisplayDate } from '../utils/dateUtils';
import { getImageFromLocalStorage } from '../utils/imageUtils';

const TransactionDetails: React.FC = () => {
  const { selectedDate } = useTransactions();
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
  const { getDayTransactions, incomeTransactions, expenseTransactions } = useTransactionData();





  // 取引項目の表示
  const renderTransactionItem = (transaction: Transaction) => (
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
  );

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
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {getDayTransactions.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
          この日の取引記録はありません
        </Typography>
      ) : (
        <Box>
          {/* 収入セクション */}
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
                    収入 ({incomeTransactions.length}件)
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

          {/* 支出セクション */}
          {expenseTransactions.length > 0 && (
            <Accordion 
              defaultExpanded 
              sx={{ 
                mt: incomeTransactions.length > 0 ? 1 : 0,
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
