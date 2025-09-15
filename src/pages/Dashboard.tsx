import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import BudgetSettingsForm from '../components/BudgetSettingsForm';
import BudgetSettingsTable from '../components/BudgetSettingsTable';
import BudgetBreakdownForm from '../components/BudgetBreakdownForm';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1, 
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          ダッシュボード
        </Typography>
        <Typography 
          variant="h5" 
          color="textSecondary" 
          sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          予算と貯蓄目標の管理
        </Typography>
      </Box>
      
      {/* 予算・貯蓄目標設定フォーム */}
      <BudgetSettingsForm />
      
      {/* 月間予算の内訳 */}
      <BudgetBreakdownForm />

      {/* 3年分の設定値一覧 */}
      <BudgetSettingsTable />
    </Container>
  );
};

export default Dashboard;
