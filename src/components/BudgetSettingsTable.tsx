import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Button,
  ButtonGroup,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart, ShowChart, TableChart, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useBudget } from '../contexts/BudgetContext';
import BudgetSettingsChart from './BudgetSettingsChart';

const BudgetSettingsTable: React.FC = () => {
  const { getBudgetSettings } = useBudget();
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showTable, setShowTable] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 3年分のデータを生成（過去1年、現在年、未来1年）
  const generateThreeYearsData = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const months = [
      { value: 1, name: '1月' },
      { value: 2, name: '2月' },
      { value: 3, name: '3月' },
      { value: 4, name: '4月' },
      { value: 5, name: '5月' },
      { value: 6, name: '6月' },
      { value: 7, name: '7月' },
      { value: 8, name: '8月' },
      { value: 9, name: '9月' },
      { value: 10, name: '10月' },
      { value: 11, name: '11月' },
      { value: 12, name: '12月' },
    ];

    const data = [];
    for (const year of years) {
      for (const month of months) {
        const settings = getBudgetSettings(year, month.value);
        const isCurrentMonth = year === currentYear && month.value === currentMonth;
        data.push({
          year,
          month: month.value,
          monthName: month.name,
          yearMonth: `${year}年${month.name}`,
          isCurrentMonth,
          settings,
        });
      }
    }
    return data;
  };

  const threeYearsData = generateThreeYearsData();

  return (
    <Paper elevation={2} sx={{ mt: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          mb: 3 
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1, 
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              3年分の設定値一覧
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' }, 
                color: 'textSecondary',
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              過去1年・現在年・未来1年の月毎設定値
            </Typography>
          </Box>
          
          {/* 表示切り替えボタン */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <ButtonGroup 
              size={isMobile ? 'medium' : 'large'} 
              variant="outlined"
              orientation={isMobile ? 'vertical' : 'horizontal'}
              sx={{
                '& .MuiButton-root': {
                  fontSize: { xs: '0.8rem', sm: '1.0rem', md: '1.1rem' },
                  px: { xs: 2, sm: 2.5, md: 3 },
                  py: { xs: 1, sm: 1.5 }
                }
              }}
            >
              <Button
                startIcon={<TableChart sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem' } }} />}
                onClick={() => setShowTable(!showTable)}
                variant={showTable ? 'contained' : 'outlined'}
              >
                {showTable ? <ExpandLess sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem' } }} /> : <ExpandMore sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem' } }} />}
                テーブル
              </Button>
              <Button
                startIcon={<ShowChart sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem' } }} />}
                onClick={() => {
                  setShowChart(!showChart);
                  setChartType('line');
                }}
                variant={showChart && chartType === 'line' ? 'contained' : 'outlined'}
              >
                線グラフ
              </Button>
              <Button
                startIcon={<BarChart sx={{ fontSize: { xs: '1.0rem', sm: '1.2rem' } }} />}
                onClick={() => {
                  setShowChart(!showChart);
                  setChartType('bar');
                }}
                variant={showChart && chartType === 'bar' ? 'contained' : 'outlined'}
              >
                棒グラフ
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* グラフ表示 */}
        {showChart && (
          <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }, 
                fontWeight: 'bold', 
                mb: 2, 
                textAlign: 'center' 
              }}
            >
              {chartType === 'line' ? '線グラフ表示' : '棒グラフ表示'}
            </Typography>
            <BudgetSettingsChart chartType={chartType} />
          </Box>
        )}

        {/* テーブル表示 */}
        <Collapse in={showTable}>
          <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 'auto', sm: 650 } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' }, 
                  fontWeight: 'bold', 
                  padding: { xs: '8px', sm: '12px', md: '16px' } 
                }}>
                  年月
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' }, 
                    fontWeight: 'bold', 
                    padding: { xs: '8px', sm: '12px', md: '16px' } 
                  }}
                >
                  月間予算
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' }, 
                    fontWeight: 'bold', 
                    padding: { xs: '8px', sm: '12px', md: '16px' } 
                  }}
                >
                  貯蓄目標額
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {threeYearsData.map((row, index) => (
                <TableRow
                  key={`${row.year}-${row.month}`}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'action.hover',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      opacity: 0.1,
                    },
                  }}
                >
                  <TableCell sx={{ 
                    fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' }, 
                    padding: { xs: '8px', sm: '12px', md: '16px' } 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      flexDirection: { xs: 'column', sm: 'row' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' } }}
                      >
                        {row.yearMonth}
                      </Typography>
                      {row.isCurrentMonth && (
                        <Chip
                          label="現在"
                          size="small"
                          color="primary"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                            fontWeight: 'bold',
                            height: { xs: '20px', sm: '24px' }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' }, 
                      padding: { xs: '8px', sm: '12px', md: '16px' } 
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' },
                        fontWeight: row.isCurrentMonth ? 'bold' : 'normal',
                        color: row.isCurrentMonth ? 'primary.main' : 'text.primary',
                      }}
                    >
                      ¥{row.settings.monthlyBudget.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' }, 
                      padding: { xs: '8px', sm: '12px', md: '16px' } 
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.2rem' },
                        fontWeight: row.isCurrentMonth ? 'bold' : 'normal',
                        color: row.isCurrentMonth ? 'secondary.main' : 'text.primary',
                      }}
                    >
                      ¥{row.settings.savingsGoal.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableContainer>
        </Collapse>

        {/* サマリー統計 */}
        <Box sx={{ 
          mt: { xs: 2, sm: 3, md: 4 }, 
          p: { xs: 2, sm: 2.5, md: 3 }, 
          backgroundColor: 'grey.50', 
          borderRadius: 2 
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' }, 
              fontWeight: 'bold', 
              mb: 2,
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            3年間の統計
          </Typography>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: { xs: 2, sm: 3 }
          }}>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' }, 
                  color: 'textSecondary',
                  mb: 0.5
                }}
              >
                平均月間予算
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' }, 
                  fontWeight: 'bold', 
                  color: 'primary.main' 
                }}
              >
                ¥{Math.round(threeYearsData.reduce((sum, row) => sum + row.settings.monthlyBudget, 0) / threeYearsData.length).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' }, 
                  color: 'textSecondary',
                  mb: 0.5
                }}
              >
                平均貯蓄目標額
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' }, 
                  fontWeight: 'bold', 
                  color: 'secondary.main' 
                }}
              >
                ¥{Math.round(threeYearsData.reduce((sum, row) => sum + row.settings.savingsGoal, 0) / threeYearsData.length).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' }, 
                  color: 'textSecondary',
                  mb: 0.5
                }}
              >
                最高月間予算
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' }, 
                  fontWeight: 'bold', 
                  color: 'primary.main' 
                }}
              >
                ¥{Math.max(...threeYearsData.map(row => row.settings.monthlyBudget)).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.0rem', md: '1.1rem' }, 
                  color: 'textSecondary',
                  mb: 0.5
                }}
              >
                最高貯蓄目標額
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.0rem', sm: '1.2rem', md: '1.3rem' }, 
                  fontWeight: 'bold', 
                  color: 'secondary.main' 
                }}
              >
                ¥{Math.max(...threeYearsData.map(row => row.settings.savingsGoal)).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default BudgetSettingsTable;
