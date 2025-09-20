import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Card, CardContent, Grid, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useTransactionData } from '../hooks/useTransactionData';
// MonthlySummaryは削除されました（現場ベース管理に移行）

const Calendar: React.FC = () => {
  const [selectedDateDay, setSelectedDateDay] = useState<number | null>(null);
  const { selectedDate, setSelectedDate, setIsDateClicked } = useTransactions();
  const { getDayDataForDate } = useTransactionData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')); // 600px未満
  const currentDate = new Date();
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth() + 1);
  const today = currentDate.getDate();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const currentMonthKey = `${displayYear}-${String(displayMonth).padStart(2, '0')}`;

  // 日付の収支データを取得
  const getDayData = (day: number) => {
    const date = new Date(displayYear, displayMonth - 1, day);
    return getDayDataForDate(date);
  };



  // 前月に移動
  const goToPreviousMonth = () => {
    if (displayMonth === 1) {
      setDisplayMonth(12);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
    setSelectedDateDay(null); // 選択状態をリセット
    setIsDateClicked(false); // クリック状態もリセット
  };

  // 次月に移動
  const goToNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayMonth(1);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
    setSelectedDateDay(null); // 選択状態をリセット
    setIsDateClicked(false); // クリック状態もリセット
  };

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const days = [];
    const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth - 1, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = 日曜日, 1 = 月曜日, etc.
    
    // 前月の日付で埋める（グレーアウト）
    const prevMonth = displayMonth === 1 ? 12 : displayMonth - 1;
    const prevYear = displayMonth === 1 ? displayYear - 1 : displayYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <Grid key={`prev-${day}`} size={12/7}>
          <Card
            sx={{
              minHeight: { xs: '65px', sm: '80px' },
              height: { xs: '65px', sm: 'auto' },
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'grey.100',
              m: 0,
              borderRadius: { xs: 1, sm: 1 },
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.disabled'
                }}
              >
                {day}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      );
    }
    
    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = getDayData(day);
      const hasTransaction = dayData.income > 0 || dayData.expense > 0;
      const isToday = day === today && displayYear === currentYear && displayMonth === currentMonth;
      const isSelected = day === selectedDateDay;
      
      // 曜日を計算（0 = 日曜日, 6 = 土曜日）
      const dayOfWeek = new Date(displayYear, displayMonth - 1, day).getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;

      days.push(
        <Grid key={day} size={12/7}>
          <Card
            sx={{
              minHeight: { xs: '65px', sm: '80px' },
              height: { xs: '65px', sm: 'auto' },
              cursor: 'pointer',
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              backgroundColor: isToday ? '#e3f2fd' : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&:active': {
                backgroundColor: 'action.selected',
                transform: 'scale(0.98)',
              },
              m: 0,
              transition: 'all 0.1s ease-in-out',
              touchAction: 'manipulation',
              borderRadius: { xs: 1, sm: 1 },
            }}
            onClick={() => {
              setSelectedDateDay(isSelected ? null : day);
              // コンテキストの選択日付も更新
              if (!isSelected) {
                const newSelectedDate = new Date(displayYear, displayMonth - 1, day);
                setSelectedDate(newSelectedDate);
                setIsDateClicked(true); // 日付がクリックされたことを記録
              } else {
                setSelectedDate(null);
                setIsDateClicked(false); // 選択解除時はクリック状態もリセット
              }
            }}
          >
            <CardContent sx={{ 
                p: { xs: '2px', sm: 1 }, 
                '&:last-child': { pb: { xs: '2px', sm: 1 } },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: { xs: 0.2, sm: 0.5 },
                overflow: 'hidden'
              }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: isToday ? 'bold' : 'normal',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  lineHeight: 1,
                  color: isToday 
                    ? 'primary.main' 
                    : isSunday 
                      ? 'error.main' 
                      : isSaturday 
                        ? 'info.main' 
                        : 'text.primary',
                  mb: { xs: 0, sm: 0.25 }
                }}
              >
                {day}
              </Typography>
              
              {hasTransaction && (
                <Box sx={{ 
                  width: '100%', 
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: { xs: 0.1, sm: 0.2 }
                }}>
                  {/* モバイルでは収支のみ表示、デスクトップでは詳細表示 */}
                  {(dayData.income > 0 || dayData.expense > 0) && (
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {dayData.income > 0 && (
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          display="block"
                          sx={{ 
                            fontSize: '0.65rem',
                            lineHeight: 1.1,
                            wordBreak: 'keep-all',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          +¥{dayData.income.toLocaleString()}
                        </Typography>
                      )}
                      {dayData.expense > 0 && (
                        <Typography 
                          variant="caption" 
                          color="error.main" 
                          display="block"
                          sx={{ 
                            fontSize: '0.65rem',
                            lineHeight: 1.1,
                            wordBreak: 'keep-all',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          -¥{dayData.expense.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* 収支（モバイル・デスクトップ共通） */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      lineHeight: 1,
                      color: dayData.balance >= 0 ? 'success.main' : 'error.main'
                    }}
                    display="block"
                  >
                    {/* モバイルではK表記、デスクトップでは通常表記 */}
                    {dayData.balance >= 0 ? '+' : ''}¥{
                      isSmallScreen && Math.abs(dayData.balance) >= 10000 
                        ? (Math.abs(dayData.balance) >= 1000000 
                          ? `${Math.floor(Math.abs(dayData.balance) / 1000000)}M`
                          : `${Math.floor(Math.abs(dayData.balance) / 1000)}k`)
                        : dayData.balance.toLocaleString()
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      );
    }
    
    // 翌月の日付で埋める（グレーアウト）
    const totalCells = 42; // 6週間 × 7日
    const remainingCells = totalCells - days.length;
    
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <Grid key={`next-${day}`} size={12/7}>
          <Card
            sx={{
              minHeight: { xs: '65px', sm: '80px' },
              height: { xs: '65px', sm: 'auto' },
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'grey.100',
              m: 0,
              borderRadius: { xs: 1, sm: 1 },
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.disabled'
                }}
              >
                {day}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      );
    }
    
    return days;
  };

  // 選択された日の詳細情報
  const getSelectedDayDetails = () => {
    if (!selectedDateDay) return null;
    
    const dayData = getDayData(selectedDateDay);
    
    return (
      <Paper elevation={1} sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          {displayMonth}月{selectedDateDay}日の詳細
        </Typography>
        <Grid container spacing={2}>
          <Grid size={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">入金</Typography>
              <Typography 
                variant="h6" 
                color="success.main"
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ¥{dayData.income.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid size={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">支出</Typography>
              <Typography 
                variant="h6" 
                color="error.main"
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ¥{dayData.expense.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid size={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">収支</Typography>
              <Typography 
                variant="h6" 
                color={dayData.balance >= 0 ? 'success.main' : 'error.main'}
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  wordBreak: 'keep-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {dayData.balance >= 0 ? '+' : ''}¥{dayData.balance.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>      
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* ヘッダー */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <IconButton size="small" onClick={goToPreviousMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {displayYear}年{displayMonth}月
        </Typography>
        <IconButton size="small" onClick={goToNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* 曜日ヘッダー */}
      <Grid container spacing={0.5} mb={1}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <Grid key={day} size={12/7}>
            <Box textAlign="center" p={1}>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                color={index === 0 ? 'error.main' : index === 6 ? 'info.main' : 'textSecondary'}
              >
                {day}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* カレンダーグリッド */}
      <Grid container spacing={{ xs: 0.25, sm: 0.5 }}>
        {generateCalendarDays()}
      </Grid>

        {/* 選択された日の詳細（デスクトップのみ） */}
        {!isMobile && getSelectedDayDetails()}
      </Paper>
    </Box>
  );
};

export default Calendar;