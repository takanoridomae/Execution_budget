import React from 'react';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useBudget } from '../contexts/BudgetContext';

interface BudgetSettingsChartProps {
  chartType: 'line' | 'bar';
}

const BudgetSettingsChart: React.FC<BudgetSettingsChartProps> = ({ chartType = 'line' }) => {
  const { getBudgetSettings } = useBudget();
  
  // 3年分のデータを生成
  const generateChartData = () => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const data = [];
    for (const year of years) {
      for (const month of months) {
        const settings = getBudgetSettings(year, month);
        data.push({
          yearMonth: `${year}/${month.toString().padStart(2, '0')}`,
          displayName: `${year}年${month}月`,
          year,
          month,
          monthlyBudget: settings.monthlyBudget,
          savingsGoal: settings.savingsGoal,
        });
      }
    }
    return data;
  };

  const chartData = generateChartData();

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 2, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              sx={{ 
                fontSize: '1rem',
                color: entry.color,
                fontWeight: 'bold'
              }}
            >
              {entry.dataKey === 'monthlyBudget' ? '月間予算' : '貯蓄目標額'}: ¥{entry.value.toLocaleString()}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Y軸の値をフォーマット
  const formatYAxis = (value: number) => {
    return `¥${(value / 10000).toFixed(0)}万`;
  };

  // グラフの共通設定
  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 40, bottom: 60 },
  };

  return (
    <Box sx={{ width: '100%', height: 500, mt: 3 }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="yearMonth"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="monthlyBudget"
              stroke="#1976d2"
              strokeWidth={3}
              dot={{ fill: '#1976d2', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: '#1976d2', strokeWidth: 2 }}
              name="月間予算"
            />
            <Line
              type="monotone"
              dataKey="savingsGoal"
              stroke="#9c27b0"
              strokeWidth={3}
              dot={{ fill: '#9c27b0', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: '#9c27b0', strokeWidth: 2 }}
              name="貯蓄目標額"
            />
          </LineChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="yearMonth"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}
            />
            <Bar
              dataKey="monthlyBudget"
              fill="#1976d2"
              name="月間予算"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="savingsGoal"
              fill="#9c27b0"
              name="貯蓄目標額"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default BudgetSettingsChart;
