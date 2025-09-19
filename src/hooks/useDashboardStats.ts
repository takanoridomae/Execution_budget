import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTransactions } from '../contexts/TransactionContext';

export const useDashboardStats = () => {
  const { sites, activeSites, selectedSiteId } = useSites();
  const { getTotalBudgetBySite, getCategoriesBySite } = useCategories();
  const { siteExpenses, getSiteIncomesBySite, getSiteExpensesBySite } = useTransactions();

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

  return {
    // 選択された現場
    selectedSite,
    selectedSiteCategories,
    selectedSiteBudget,
    selectedSiteIncomeAmount,
    selectedSiteExpenseAmount,
    budgetMinusExpense,
    incomeMinusExpense,
    
    // 全体統計
    totalSites,
    totalBudget,
    totalExpenseCount,
    totalExpenseAmount,
    
    // その他
    activeSites,
    sites,
    getTotalBudgetBySite,
    getCategoriesBySite,
    getSiteExpensesBySite
  };
};
