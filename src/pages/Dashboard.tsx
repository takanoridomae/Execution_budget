import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Button,
  Alert,
  Divider
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Category as CategoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import SiteManagement from '../components/SiteManagement';
import CategoryManagement from '../components/CategoryManagement';

const Dashboard: React.FC = () => {
  const { sites, activeSites, selectedSiteId, setSelectedSiteId } = useSites();
  const { getTotalBudgetBySite, getCategoriesBySite } = useCategories();
  const { siteExpenses, getSiteIncomesBySite, getSiteExpensesBySite } = useTransactions();
  
  const [showSiteManagement, setShowSiteManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // 選択された現場の情報
  const selectedSite = selectedSiteId ? sites.find(s => s.id === selectedSiteId) : null;
  const selectedSiteCategories = selectedSiteId ? getCategoriesBySite(selectedSiteId) : [];
  const selectedSiteBudget = selectedSiteId ? getTotalBudgetBySite(selectedSiteId) : 0;
  const selectedSiteIncomeAmount = selectedSiteId ? getSiteIncomesBySite(selectedSiteId).reduce((sum, income) => sum + income.amount, 0) : 0;
  const selectedSiteExpenseAmount = selectedSiteId ? getSiteExpensesBySite(selectedSiteId).reduce((sum, expense) => sum + expense.amount, 0) : 0;
  const budgetMinusExpense = selectedSiteBudget - selectedSiteExpenseAmount;
  const incomeMinusExpense = selectedSiteIncomeAmount - selectedSiteExpenseAmount;

  // 全体の統計
  const totalSites = activeSites.length;
  const totalBudget = activeSites.reduce((sum, site) => sum + getTotalBudgetBySite(site.id), 0);
  
  // 稼働中現場のみの支出を計算
  const activeSiteIds = activeSites.map(site => site.id);
  const activeSiteExpenses = siteExpenses.filter(expense => activeSiteIds.includes(expense.siteId));
  const totalExpenseCount = activeSiteExpenses.length;
  const totalExpenseAmount = activeSiteExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (showSiteManagement) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2, md: 3 } }}>
        <Button 
          onClick={() => setShowSiteManagement(false)} 
          sx={{ mb: 2 }}
        >
          ← ダッシュボードに戻る
        </Button>
        <SiteManagement />
      </Container>
    );
  }

  if (showCategoryManagement) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2, md: 3 } }}>
        <Button 
          onClick={() => setShowCategoryManagement(false)} 
          sx={{ mb: 2 }}
        >
          ← ダッシュボードに戻る
        </Button>
        <CategoryManagement />
      </Container>
    );
  }

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
          現場管理ダッシュボード
        </Typography>
        <Typography 
          variant="h5" 
          color="textSecondary" 
          sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          現場とカテゴリーベースの予算管理
        </Typography>
      </Box>

      {/* 全体統計 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <BusinessIcon color="primary" />
                <Typography variant="h6">稼働現場数</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {totalSites}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AssessmentIcon color="secondary" />
                <Typography variant="h6">総予算</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                ¥{totalBudget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CategoryIcon color="error" />
                <Typography variant="h6">支出件数</Typography>
              </Box>
              <Typography variant="h3" color="error.main">
                {totalExpenseCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CategoryIcon color="warning" />
                <Typography variant="h6">総支出金額</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                ¥{totalExpenseAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* クイックアクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          クイックアクション
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<BusinessIcon />}
            onClick={() => setShowSiteManagement(true)}
          >
            現場管理
          </Button>
          <Button
            variant="contained"
            startIcon={<CategoryIcon />}
            onClick={() => setShowCategoryManagement(true)}
          >
            カテゴリー管理
          </Button>
        </Box>
      </Box>

      {/* 現場がない場合の案内 */}
      {totalSites === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          現場が登録されていません。まず「現場管理」から現場を登録してください。
        </Alert>
      )}

      {/* 選択された現場の詳細 */}
      {selectedSite && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            選択中の現場: {selectedSite.name}
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} {...({} as any)}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    現場情報
                  </Typography>
                  {selectedSite.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {selectedSite.description}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>予算合計:</strong> ¥{selectedSiteBudget.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>カテゴリー数:</strong> {selectedSiteCategories.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>実績入金:</strong> ¥{selectedSiteIncomeAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>実績支出:</strong> ¥{selectedSiteExpenseAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: budgetMinusExpense >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                    mb: 1
                  }}>
                    <strong>予算残高:</strong> {budgetMinusExpense >= 0 ? "+" : ""}¥{budgetMinusExpense.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: incomeMinusExpense >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}>
                    <strong>実績利益:</strong> {incomeMinusExpense >= 0 ? "+" : ""}¥{incomeMinusExpense.toLocaleString()}
                  </Typography>
                  {selectedSite.comment && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        💬 {selectedSite.comment}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} md={6} {...({} as any)}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    カテゴリー一覧
                  </Typography>
                  {selectedSiteCategories.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      カテゴリーが登録されていません
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {selectedSiteCategories.map((category) => (
                        <Box key={category.id} display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {category.name}
                            </Typography>
                            {category.description && (
                              <Typography variant="caption" color="text.secondary">
                                {category.description}
                              </Typography>
                            )}
                          </Box>
                          <Chip 
                            label={`¥${category.budgetAmount.toLocaleString()}`}
                            size="small"
                            color={category.isActive ? 'primary' : 'default'}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 現場一覧 */}
      {activeSites.length > 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">
              現場一覧
            </Typography>
            <Button
              size="small"
              onClick={() => setSelectedSiteId(null)}
              disabled={!selectedSiteId}
            >
              選択をクリア
            </Button>
          </Box>
          <Grid container spacing={2}>
            {activeSites.map((site) => {
              const budget = getTotalBudgetBySite(site.id);
              const categories = getCategoriesBySite(site.id);
              const siteExpenseAmount = getSiteExpensesBySite(site.id).reduce((sum, expense) => sum + expense.amount, 0);
              const isSelected = selectedSiteId === site.id;
              
              return (
                <Grid key={site.id} item xs={12} sm={6} md={4} {...({} as any)}>
                  <Card 
                    elevation={isSelected ? 8 : 2}
                    sx={{ 
                      cursor: 'pointer',
                      border: isSelected ? 2 : 0,
                      borderColor: 'primary.main',
                      '&:hover': { elevation: 4 }
                    }}
                    onClick={() => setSelectedSiteId(site.id)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {site.name}
                      </Typography>
                      {site.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {site.description}
                        </Typography>
                      )}
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          予算: ¥{budget.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={isSelected ? '選択中' : '選択'} 
                          color={isSelected ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        カテゴリー: {categories.length} | 支出: ¥{siteExpenseAmount.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Dashboard;
