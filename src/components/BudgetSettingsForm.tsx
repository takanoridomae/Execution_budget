import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Collapse,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Settings, ExpandLess, ExpandMore, Save } from '@mui/icons-material';
import { useBudget } from '../contexts/BudgetContext';
import { useAlert } from '../hooks/useAlert';
import { parseCommaSeparatedNumber } from '../utils/numberUtils';
import NumericInput from './common/NumericInput';

const BudgetSettingsForm: React.FC = () => {
  const { getBudgetSettings, updateBudgetSettings, syncStatus, forceSyncFromFirebase } = useBudget();
  const { alert, showSuccess } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  
  // 現在の年月を取得
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // 選択された年月の設定を取得
  const currentSettings = getBudgetSettings(selectedYear, selectedMonth);
  
  const [monthlyBudget, setMonthlyBudget] = useState(currentSettings.monthlyBudget.toString());
  const [savingsGoal, setSavingsGoal] = useState(currentSettings.savingsGoal.toString());

  // 選択年月が変更されたら設定値を更新
  useEffect(() => {
    const settings = getBudgetSettings(selectedYear, selectedMonth);
    setMonthlyBudget(settings.monthlyBudget.toString());
    setSavingsGoal(settings.savingsGoal.toString());
  }, [selectedYear, selectedMonth, getBudgetSettings]);

  const handleSave = async () => {
    const budgetAmount = parseCommaSeparatedNumber(monthlyBudget);
    const savingsAmount = parseCommaSeparatedNumber(savingsGoal);

    try {
      await updateBudgetSettings(selectedYear, selectedMonth, {
        monthlyBudget: budgetAmount,
        savingsGoal: savingsAmount,
      });

      showSuccess(`${selectedYear}年${selectedMonth}月の予算・貯蓄目標を更新しました（デバイス間同期済み）`);
      setIsOpen(false);
    } catch (error) {
      console.error('予算設定の更新に失敗しました:', error);
      showSuccess(`${selectedYear}年${selectedMonth}月の予算・貯蓄目標を更新しました（ローカル保存）`);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    const settings = getBudgetSettings(selectedYear, selectedMonth);
    setMonthlyBudget(settings.monthlyBudget.toString());
    setSavingsGoal(settings.savingsGoal.toString());
    setIsOpen(false);
  };



  // 年の選択肢を生成（現在年の前後5年）
  const generateYearOptions = () => {
    const years = [];
    for (let i = currentDate.getFullYear() - 5; i <= currentDate.getFullYear() + 5; i++) {
      years.push(i);
    }
    return years;
  };

  // 月の選択肢
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

  return (
    <Paper elevation={2} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
      {/* ヘッダー */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings color="primary" sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' } 
            }}
          >
            予算・貯蓄目標設定
          </Typography>
        </Box>
        <IconButton size="large">
          {isOpen ? (
            <ExpandLess sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
          ) : (
            <ExpandMore sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
          )}
        </IconButton>
      </Box>

      {/* 成功メッセージ */}
      {alert && (
        <Box sx={{ px: { xs: 1.5, sm: 2 } }}>
          <Alert 
            severity={alert.type} 
            sx={{ 
              mb: { xs: 1.5, sm: 2 }, 
              fontSize: { xs: '1.0rem', sm: '1.1rem', md: '1.2rem' } 
            }}
          >
            {alert.message}
          </Alert>
        </Box>
      )}

      {/* 設定フォーム */}
      <Collapse in={isOpen}>
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          pt: 0, 
          borderTop: '1px solid', 
          borderColor: 'divider' 
        }}>
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid size={12}>
              <Typography 
                variant="h6" 
                color="textSecondary" 
                sx={{ 
                  mb: 2, 
                  fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                年月を選択して、その月の予算と貯蓄目標額を設定してください。
              </Typography>
            </Grid>

            {/* 年月選択 */}
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
                  {generateYearOptions().map((year) => (
                    <MenuItem key={year} value={year} sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                      {year}年
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
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value} sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 予算・貯蓄目標入力 */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <NumericInput
                fullWidth
                label="月間予算"
                value={monthlyBudget}
                onChange={setMonthlyBudget}
                InputLabelProps={{
                  sx: { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }
                }}
                FormHelperTextProps={{
                  sx: { fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' } }
                }}
                placeholder="200,000"
                helperText={`${selectedYear}年${selectedMonth}月の支出予算を入力`}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' },
                    padding: { xs: '12px 14px', sm: '14px', md: '16px 14px' }
                  }
                }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }}>¥</Typography>,
                  sx: { fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <NumericInput
                fullWidth
                label="月間貯蓄目標額"
                value={savingsGoal}
                onChange={setSavingsGoal}
                InputLabelProps={{
                  sx: { fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }
                }}
                FormHelperTextProps={{
                  sx: { fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' } }
                }}
                placeholder="100,000"
                helperText={`${selectedYear}年${selectedMonth}月の貯蓄目標額を入力`}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' },
                    padding: { xs: '12px 14px', sm: '14px', md: '16px 14px' }
                  }
                }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }}>¥</Typography>,
                  sx: { fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }
                }}
              />
            </Grid>

            <Grid size={12}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: { xs: 'center', sm: 'flex-end' },
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCancel}
                  sx={{ 
                    fontSize: { xs: '1.0rem', sm: '1.1rem', md: '1.2rem' },
                    padding: { xs: '10px 20px', sm: '11px 22px', md: '12px 24px' }
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }} />}
                  onClick={handleSave}
                  sx={{ 
                    fontSize: { xs: '1.0rem', sm: '1.1rem', md: '1.2rem' },
                    padding: { xs: '10px 20px', sm: '11px 22px', md: '12px 24px' }
                  }}
                >
                  保存
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* 現在の設定表示 */}
      {!isOpen && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' }, 
              textAlign: 'center' 
            }}
          >
            {selectedYear}年{selectedMonth}月の設定
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h6" 
                  color="textSecondary" 
                  sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' } }}
                >
                  月間予算
                </Typography>
                <Typography 
                  variant="h4" 
                  color="primary" 
                  sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' } }}
                >
                  ¥{currentSettings.monthlyBudget.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h6" 
                  color="textSecondary" 
                  sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' } }}
                >
                  貯蓄目標額
                </Typography>
                <Typography 
                  variant="h4" 
                  color="secondary" 
                  sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' } }}
                >
                  ¥{currentSettings.savingsGoal.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default BudgetSettingsForm;