import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, MonetizationOn } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTransactions } from '../contexts/TransactionContext';
import { useBudget } from '../contexts/BudgetContext';
import { calculateCurrentMonthData, calculateMonthlyData } from '../utils/transactionCalculations';

interface MonthlySummaryProps {
  year?: number;
  month?: number;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ year, month }) => {
  const theme = useTheme();
  const { transactions, loading } = useTransactions();
  const { getBudgetSettings } = useBudget();
  
  // 指定された年月、または当月のデータを計算
  const currentMonthFinancials = year && month 
    ? calculateMonthlyData(transactions, year, month)
    : calculateCurrentMonthData(transactions);

  // 表示年月（指定がない場合は現在月）
  const displayYear = year || new Date().getFullYear();
  const displayMonth = month || new Date().getMonth() + 1;
  
  // 該当年月の予算設定を取得
  const budgetSettings = getBudgetSettings(displayYear, displayMonth);
  
  const monthlyData = {
    ...currentMonthFinancials,
    budget: budgetSettings.monthlyBudget,
    savingsGoal: budgetSettings.savingsGoal,
  };
  
  if (loading) {
    return (
      <Paper elevation={4} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography>データを読み込み中...</Typography>
      </Paper>
    );
  }

  const balance = monthlyData.balance;
  const budgetUsed = (monthlyData.expense / monthlyData.budget) * 100;
  const savingsProgress = (balance / monthlyData.savingsGoal) * 100;

  return (
    <Paper 
      elevation={4} 
      sx={{ 
        p: 3, 
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.1)',
          transform: 'skewY(-6deg)',
          transformOrigin: 'top left',
        }
      }}
    >
      {/* ヘッダー */}
      <Box sx={{ position: 'relative', zIndex: 1, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {month || new Date().getMonth() + 1}月のサマリー
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {year || new Date().getFullYear()}年 財務概要
        </Typography>
      </Box>

      {/* メインサマリーカード */}
      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        {/* 収入カード */}
        <Grid size={6}>
          <Card 
            elevation={8}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.incomeColor.main} 0%, ${theme.palette.incomeColor.dark} 100%)`,
              color: theme.palette.incomeColor.contrastText,
              transform: 'perspective(1000px) rotateX(5deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(0deg) translateY(-5px)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MonetizationOn sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                収入
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ¥{monthlyData.income.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                <TrendingUp sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">前月比 +8.5%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 支出カード */}
        <Grid size={6}>
          <Card 
            elevation={8}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.expenseColor.main} 0%, ${theme.palette.expenseColor.dark} 100%)`,
              color: theme.palette.expenseColor.contrastText,
              transform: 'perspective(1000px) rotateX(5deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(0deg) translateY(-5px)',
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingDown sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                支出
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ¥{monthlyData.expense.toLocaleString()}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                <TrendingDown sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">前月比 -2.3%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 残高と進捗 */}
      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1, mt: 2 }}>
        {/* 残高カード */}
        <Grid size={12}>
          <Card 
            elevation={12}
            sx={{ 
              background: balance >= 0 
                ? `linear-gradient(135deg, ${theme.palette.balanceColor.main} 0%, ${theme.palette.balanceColor.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              color: balance >= 0 ? theme.palette.balanceColor.contrastText : theme.palette.warning.contrastText,
              transform: 'perspective(1000px) rotateX(8deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'perspective(1000px) rotateX(0deg) translateY(-8px)',
              },
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                animation: 'shimmer 3s ease-in-out infinite',
              },
              '@keyframes shimmer': {
                '0%, 100%': { transform: 'translateX(-100%) translateY(-100%)' },
                '50%': { transform: 'translateX(-50%) translateY(-50%)' },
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <AccountBalance sx={{ fontSize: 50, mb: 2, opacity: 0.9 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                今月の収支
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                {balance >= 0 ? '+' : ''}¥{balance.toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {balance >= 0 ? '素晴らしい貯蓄ペースです！' : '支出を見直してみましょう'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 進捗バー */}
      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1, mt: 2 }}>
        <Grid size={6}>
          <Box 
            sx={{ 
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              p: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              予算使用率
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(budgetUsed, 100)}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: budgetUsed > 100 ? theme.palette.expenseColor.main : theme.palette.balanceColor.main,
                  borderRadius: 4,
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {budgetUsed.toFixed(1)}% (¥{monthlyData.budget.toLocaleString()}中)
            </Typography>
          </Box>
        </Grid>

        <Grid size={6}>
          <Box 
            sx={{ 
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              p: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              貯蓄目標達成率
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(savingsProgress, 100)}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.incomeColor.main,
                  borderRadius: 4,
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {savingsProgress.toFixed(1)}% (目標¥{monthlyData.savingsGoal.toLocaleString()})
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MonthlySummary;