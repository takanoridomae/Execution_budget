import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Button, IconButton, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Divider, TextField, FormControl, InputLabel, Select, MenuItem, Card, CardContent, useTheme, useMediaQuery, Chip, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Add, Delete, Edit, Save, Close, Check } from '@mui/icons-material';
import { useBudget } from '../contexts/BudgetContext';
import { BudgetItem, ExpenseCategory } from '../types';
import CategorySelect from './common/CategorySelect';
import NumericInput from './common/NumericInput';
import { parseCommaSeparatedNumber } from '../utils/numberUtils';
import { useAlert } from '../hooks/useAlert';

interface BudgetBreakdownFormProps {
  year?: number;
  month?: number;
}

const BudgetBreakdownForm: React.FC<BudgetBreakdownFormProps> = ({ year, month }) => {
  const { getBudgetSettings, updateBudgetSettings } = useBudget();
  const { alert, showSuccess, showError, clearAlert } = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(year ?? today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(month ?? today.getMonth() + 1);
  
  // 保存状態の管理
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentSettings = useMemo(() => getBudgetSettings(selectedYear, selectedMonth), [getBudgetSettings, selectedYear, selectedMonth]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');

  const plannedTotal = useMemo(() => items.reduce((sum, it) => sum + it.amount, 0), [items]);
  const remaining = useMemo(() => currentSettings.monthlyBudget - plannedTotal, [currentSettings.monthlyBudget, plannedTotal]);

  // 年の選択肢（現在年の前後5年）
  const generateYearOptions = () => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  };

  const months = [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' },
  ];

  // 年月変更時にその月の内訳を読み込む
  useEffect(() => {
    setItems(currentSettings.breakdown || []);
  }, [currentSettings]);

  const handleAdd = () => {
    const amountNum = parseCommaSeparatedNumber(newAmount || '0');
    if (!newCategory || !newContent || amountNum <= 0) return;
    const item: BudgetItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      category: newCategory as ExpenseCategory,
      content: newContent,
      amount: amountNum,
    };
    const next = [...items, item];
    setItems(next);
    setNewCategory('');
    setNewContent('');
    setNewAmount('');
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditCategory(item.category);
    setEditContent(item.content);
    setEditAmount(String(item.amount));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory('');
    setEditContent('');
    setEditAmount('');
  };

  const commitEdit = () => {
    if (!editingId) return;
    const amountNum = parseCommaSeparatedNumber(editAmount || '0');
    if (!editCategory || !editContent || amountNum <= 0) return;
    setItems(prev => prev.map(i => (i.id === editingId ? { ...i, category: editCategory as ExpenseCategory, content: editContent, amount: amountNum } : i)));
    cancelEdit();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateBudgetSettings(selectedYear, selectedMonth, {
        monthlyBudget: currentSettings.monthlyBudget,
        savingsGoal: currentSettings.savingsGoal,
        breakdown: items,
      });
      
      // 保存成功の視覚的フィードバック
      setSaveSuccess(true);
      showSuccess('月間予算の内訳を保存しました');
      
      // 成功状態を一定時間後にリセット
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('保存に失敗しました:', error);
      showError('保存に失敗しました。再度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ mt: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' } }}>
          月間予算の内訳
        </Typography>

        {/* 年月選択 */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2 } }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>年</InputLabel>
              <Select
                value={selectedYear}
                label="年"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' },
                  '& .MuiSelect-select': {
                    padding: { xs: '12px 14px', sm: '14px', md: '16px 14px' }
                  }
                }}
              >
                {generateYearOptions().map((y) => (
                  <MenuItem key={y} value={y} sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                    {y}年
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>月</InputLabel>
              <Select
                value={selectedMonth}
                label="月"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' },
                  '& .MuiSelect-select': {
                    padding: { xs: '12px 14px', sm: '14px', md: '16px 14px' }
                  }
                }}
              >
                {months.map((m) => (
                  <MenuItem key={m.value} value={m.value} sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                    {m.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* 追加フォーム */}
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, backgroundColor: 'grey.50', mb: { xs: 2, sm: 3 } }}>
        {isMobile ? (
          // モバイル用縦積みレイアウト
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <CategorySelect value={newCategory} onChange={setNewCategory} transactionType="expense" fullWidth label="カテゴリー" />
            <TextField
              fullWidth
              label="内容"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="用途やメモ"
              InputLabelProps={{ sx: { fontSize: '1.1rem' } }}
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
            />
            <NumericInput
              fullWidth
              label="金額"
              value={newAmount}
              onChange={setNewAmount}
              placeholder="10,000"
              InputLabelProps={{ sx: { fontSize: '1.1rem' } }}
              sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
            />
            <Button variant="contained" startIcon={<Add />} fullWidth onClick={handleAdd} sx={{ height: 48, fontSize: '1rem' }}>
              追加
            </Button>
          </Box>
        ) : (
          // デスクトップ用横並びレイアウト
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 3 }}>
              <CategorySelect value={newCategory} onChange={setNewCategory} transactionType="expense" fullWidth label="カテゴリー" />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="内容"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="用途やメモ"
                InputLabelProps={{ sx: { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } } }}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <NumericInput
                fullWidth
                label="金額"
                value={newAmount}
                onChange={setNewAmount}
                placeholder="10,000"
                InputLabelProps={{ sx: { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } } }}
                sx={{ '& .MuiInputBase-input': { fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }}>
              <Button variant="contained" startIcon={<Add />} fullWidth onClick={handleAdd} sx={{ height: 56 }}>
                追加
              </Button>
            </Grid>
          </Grid>
        )}
        </Paper>

        <Box sx={{ mt: 3 }}>
          {isMobile ? (
            // モバイル用カード表示
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                  <Typography color="textSecondary">まだ内訳がありません</Typography>
                </Paper>
              ) : (
                items.map(item => (
                  <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {editingId === item.id ? (
                        // 編集モード
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <CategorySelect value={editCategory} onChange={setEditCategory} transactionType="expense" fullWidth label="カテゴリー" size="small" />
                          <TextField fullWidth value={editContent} onChange={(e) => setEditContent(e.target.value)} label="内容" size="small" />
                          <NumericInput fullWidth label="金額" value={editAmount} onChange={setEditAmount} size="small" />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button variant="outlined" startIcon={<Close />} onClick={cancelEdit} size="small">
                              キャンセル
                            </Button>
                            <Button variant="contained" startIcon={<Save />} onClick={commitEdit} size="small">
                              保存
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        // 表示モード
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Chip label={item.category} color="primary" variant="outlined" sx={{ fontSize: '0.9rem' }} />
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                              ¥{item.amount.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ mb: 2, fontSize: '1rem', color: 'text.primary' }}>
                            {item.content}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <IconButton aria-label="編集" onClick={() => startEdit(item)} color="primary" size="small">
                              <Edit />
                            </IconButton>
                            <IconButton aria-label="削除" onClick={() => handleDelete(item.id)} color="error" size="small">
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          ) : (
            // デスクトップ用テーブル表示
            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>カテゴリー</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>内容</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>金額</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                      <TableCell sx={{ minWidth: 120 }}>
                        {editingId === item.id ? (
                          <CategorySelect value={editCategory} onChange={setEditCategory} transactionType="expense" fullWidth label="" />
                        ) : (
                          item.category
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <TextField fullWidth value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="内容" size="small" />
                        ) : (
                          item.content
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 140 }}>
                        {editingId === item.id ? (
                          <NumericInput fullWidth label="" value={editAmount} onChange={setEditAmount} size="small" />
                        ) : (
                          `¥${item.amount.toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {editingId === item.id ? (
                          <>
                            <IconButton aria-label="保存" onClick={commitEdit} color="primary">
                              <Save />
                            </IconButton>
                            <IconButton aria-label="キャンセル" onClick={cancelEdit}>
                              <Close />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton aria-label="編集" onClick={() => startEdit(item)}>
                              <Edit />
                            </IconButton>
                            <IconButton aria-label="削除" onClick={() => handleDelete(item.id)}>
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">まだ内訳がありません</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 'bold' }}>計画合計: ¥{plannedTotal.toLocaleString()}</Typography>
          <Typography color={remaining < 0 ? 'error' : 'textSecondary'}>
            残り予算: ¥{remaining.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : saveSuccess ? (
                <Check />
              ) : (
                <Save />
              )
            }
            sx={{
              backgroundColor: saveSuccess ? 'success.main' : undefined,
              '&:hover': {
                backgroundColor: saveSuccess ? 'success.dark' : undefined,
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {isSaving ? '保存中...' : saveSuccess ? '保存完了' : '保存'}
          </Button>
        </Box>
      </Box>
      
      {/* スナックバー表示 */}
      {alert && (
        <Snackbar
          open={true}
          autoHideDuration={4000}
          onClose={clearAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={clearAlert}
            severity={alert.type}
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
};

// 簡易な内容入力テキストフィールド（MUIのTextFieldをローカル実装）
const TextFieldLike: React.FC<{ value: string; setValue: (v: string) => void }> = ({ value, setValue }) => {
  return (
    <TextField
      fullWidth
      label="内容"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="用途やメモ"
      InputLabelProps={{ sx: { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } } }}
      sx={{ '& .MuiInputBase-input': { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } } }}
    />
  );
};

export default BudgetBreakdownForm;


