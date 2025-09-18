import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { Save, Clear, CalendarToday } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { TransactionType } from '../types';
import { formatFullDate, formatDateForStorage } from '../utils/dateUtils';
import { validateAmount, validateDescription } from '../utils/validationUtils';
import { useAlert } from '../hooks/useAlert';
import NumericInput from './common/NumericInput';

const SiteTransactionForm: React.FC = () => {
  const { addSiteTransaction, addSiteIncome, addSiteExpense, selectedDate } = useTransactions();
  const { activeSites, selectedSiteId, setSelectedSiteId } = useSites();
  const { getActiveCategoriesBySite } = useCategories();
  const { alert, showSuccess, showError } = useAlert();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [siteId, setSiteId] = useState(selectedSiteId || '');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    siteId?: string;
    categoryId?: string;
    description?: string;
  }>({});

  // 選択された現場のカテゴリーを取得
  const availableCategories = siteId ? getActiveCategoriesBySite(siteId) : [];
  
  // デバッグ情報
  console.log('🔍 SiteTransactionForm Debug:', {
    activeSites: activeSites.length,
    selectedSiteId,
    siteId,
    availableCategories: availableCategories.length,
    categories: availableCategories
  });
  
  // カテゴリーデータの詳細確認
  if (availableCategories.length > 0) {
    console.log('🔍 Category Details:', availableCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      budgetAmount: cat.budgetAmount,
      siteId: cat.siteId,
      isActive: cat.isActive
    })));
  }

  // 現場変更時にカテゴリーをリセット
  useEffect(() => {
    setCategoryId('');
  }, [siteId]);

  // 選択された現場IDが変更されたら同期
  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== siteId) {
      setSiteId(selectedSiteId);
    }
  }, [selectedSiteId, siteId]);

  const clearForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    // 現場は保持
    setFieldErrors({});
  };

  const validateFields = () => {
    const errors: typeof fieldErrors = {};

    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) errors.amount = amountValidation.errorMessage || '金額が無効です';

    if (!siteId) {
      errors.siteId = '現場を選択してください';
    }

    // 支出の場合のみカテゴリー必須
    if (transactionType === 'expense' && !categoryId) {
      errors.categoryId = 'カテゴリーを選択してください';
    }

    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.isValid) errors.description = descriptionValidation.errorMessage || '内容が無効です';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      showError('入力内容を確認してください');
      return;
    }

    if (!selectedDate) {
      showError('日付が選択されていません');
      return;
    }

    setLoading(true);
    try {
      if (transactionType === 'income') {
        // 収入の場合：SiteIncomesコレクションに保存、カテゴリーは「売上」固定
        const incomeData = {
          amount: parseFloat(amount),
          content: description,
          date: formatDateForStorage(selectedDate),
          siteId,
        };
        
        await addSiteIncome(incomeData);
        showSuccess('収入を追加しました（カテゴリー: 売上）');
      } else {
        // 支出の場合：SiteExpensesコレクションに保存
        const expenseData = {
          amount: parseFloat(amount),
          content: description,
          date: formatDateForStorage(selectedDate),
          siteId,
          categoryId,
        };
        
        await addSiteExpense(expenseData);
        showSuccess('支出を追加しました');
      }
      
      clearForm();
      
      // 現場選択を同期
      if (siteId !== selectedSiteId) {
        setSelectedSiteId(siteId);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      showError('取引の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <CalendarToday color="primary" />
        <Typography variant="h6" component="h2">
          現場取引の追加
        </Typography>
      </Box>

      {selectedDate && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {formatFullDate(selectedDate)}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* 取引タイプ */}
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">取引タイプ</FormLabel>
        <RadioGroup
          row
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          <FormControlLabel value="income" control={<Radio />} label="収入" />
          <FormControlLabel value="expense" control={<Radio />} label="支出" />
        </RadioGroup>
      </FormControl>

      {/* 現場選択 */}
      <FormControl fullWidth sx={{ mb: 2 }} error={!!fieldErrors.siteId}>
        <InputLabel>現場</InputLabel>
        <Select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          label="現場"
        >
          {activeSites.map((site) => (
            <MenuItem key={site.id} value={site.id}>
              {site.name}
            </MenuItem>
          ))}
        </Select>
        {fieldErrors.siteId && (
          <Typography variant="caption" color="error">
            {fieldErrors.siteId}
          </Typography>
        )}
      </FormControl>

      {/* カテゴリー選択 */}
      {transactionType === 'income' ? (
        // 収入時は「売上」固定表示
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel shrink>カテゴリー</InputLabel>
          <TextField
            value="売上"
            label="カテゴリー"
            disabled
            fullWidth
            variant="outlined"
            sx={{ 
              '& .MuiInputBase-input': { 
                backgroundColor: '#f5f5f5',
                color: 'text.primary'
              } 
            }}
            helperText="収入のカテゴリーは自動的に「売上」になります"
          />
        </FormControl>
      ) : (
        // 支出時は通常のカテゴリー選択
        <FormControl 
          fullWidth 
          sx={{ mb: 2 }} 
          error={!!fieldErrors.categoryId}
          disabled={!siteId}
        >
          <InputLabel id="category-select-label">カテゴリー</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={categoryId}
            onChange={(e) => {
              console.log('🔍 Category selected:', e.target.value);
              setCategoryId(e.target.value);
            }}
            label="カテゴリー"
            displayEmpty
            MenuProps={{
              disablePortal: false,
              PaperProps: {
                style: {
                  maxHeight: 300,
                  zIndex: 10000,
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
            }}
          >
            <MenuItem value="" disabled>
              <em>カテゴリーを選択してください</em>
            </MenuItem>
            {availableCategories.length > 0 ? (
              availableCategories.map((category) => {
                console.log('🔍 Rendering MenuItem:', {
                  id: category.id,
                  name: category.name,
                  budgetAmount: category.budgetAmount
                });
                return (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name} (¥{Number(category.budgetAmount || 0).toLocaleString()})
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem value="" disabled>
                カテゴリーが見つかりません
              </MenuItem>
            )}
          </Select>
          {fieldErrors.categoryId && (
            <Typography variant="caption" color="error">
              {fieldErrors.categoryId}
            </Typography>
          )}
          {siteId && availableCategories.length === 0 && (
            <Typography variant="caption" color="warning.main">
              この現場にはカテゴリーが登録されていません
            </Typography>
          )}
        </FormControl>
      )}

      {/* 金額 */}
      <NumericInput
        label="金額"
        value={amount}
        onChange={setAmount}
        error={!!fieldErrors.amount}
        helperText={fieldErrors.amount}
        fullWidth
        sx={{ mb: 2 }}
        required
      />

      {/* 内容 */}
      <TextField
        label="内容"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={!!fieldErrors.description}
        helperText={fieldErrors.description}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 3 }}
        required
        placeholder="取引の詳細を入力..."
      />

      {/* ボタン */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={clearForm}
          disabled={loading}
        >
          クリア
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading || activeSites.length === 0}
        >
          {loading ? '追加中...' : '追加'}
        </Button>
      </Box>

      {activeSites.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          現場が登録されていません。まず現場を登録してください。
        </Alert>
      )}
    </Paper>
  );
};

export default SiteTransactionForm;
