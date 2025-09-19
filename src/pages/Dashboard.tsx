import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Business as BusinessIcon,
  Category as CategoryIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
  Storage as StorageIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import SiteManagement from '../components/SiteManagement';
import CategoryManagement from '../components/CategoryManagement';
import StorageIntegrityChecker from '../components/StorageIntegrityChecker';
import StatCard from '../components/common/StatCard';
import SiteInfoCard from '../components/common/SiteInfoCard';
import CategoryList from '../components/common/CategoryList';
import SiteGrid from '../components/common/SiteGrid';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useModalManager } from '../hooks/useModalManager';
import { getImageFromLocalStorage } from '../utils/imageUtils';
import { getAllDocumentsForEntity } from '../utils/documentUtils';

const Dashboard: React.FC = () => {
  const { setSelectedSiteId } = useSites();
  const [showSiteManagement, setShowSiteManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showIntegrityChecker, setShowIntegrityChecker] = useState(false);
  
  // 統計データを取得
  const dashboardStats = useDashboardStats();
  
  // モーダル管理
  const {
    imageModalOpen,
    selectedImage,
    handleImageClick,
    handleImageModalClose,
    allItemsModalOpen,
    allItemsData,
    handleShowAllItems,
    handleAllItemsModalClose
  } = useModalManager();

  // アイテム表示ハンドラー（カテゴリー用）
  const handleShowCategoryItems = (type: 'photos' | 'documents', categoryName: string, category: any) => {
    const items: any[] = [];
    
    if (type === 'photos') {
      // ローカルストレージの画像
      if (category.imageIds) {
        category.imageIds.forEach((imageId: string, index: number) => {
          const imageData = getImageFromLocalStorage(category.id, imageId);
          if (imageData) {
            items.push({
              type: 'local',
              src: imageData,
              alt: `カテゴリー画像-${index}`,
              index
            });
          }
        });
      }
      
      // Firebase Storageの画像
      if (category.imageUrls) {
        category.imageUrls.forEach((url: string, index: number) => {
          items.push({
            type: 'firebase',
            src: url,
            alt: `カテゴリー画像-${index}`,
            index
          });
        });
      }
    } else {
      // ローカルストレージの書類
      if (category.documentIds) {
        category.documentIds.forEach((documentId: string, index: number) => {
          const documents = getAllDocumentsForEntity(category.id);
          const documentInfo = documents.find(d => d.id === documentId);
          if (documentInfo) {
            items.push({
              type: 'local',
              id: documentId,
              name: documentInfo.fileName,
              categoryId: category.id,
              index
            });
          }
        });
      }
      
      // Firebase Storageの書類
      if (category.documentUrls) {
        category.documentUrls.forEach((url: string, index: number) => {
          const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || `書類-${index + 1}`;
          items.push({
            type: 'firebase',
            url,
            name: fileName,
            index
          });
        });
      }
    }
    
    handleShowAllItems(type, categoryName, items);
  };

  // dashboardStatsから必要なデータを分解代入
  const {
    selectedSite,
    selectedSiteCategories,
    selectedSiteBudget,
    selectedSiteIncomeAmount,
    selectedSiteExpenseAmount,
    budgetMinusExpense,
    incomeMinusExpense,
    totalSites,
    totalBudget,
    totalExpenseCount,
    totalExpenseAmount,
    activeSites,
    getTotalBudgetBySite,
    getCategoriesBySite,
    getSiteExpensesBySite
  } = dashboardStats;

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
          <StatCard
            title="稼働現場数"
            value={totalSites}
            icon={BusinessIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <StatCard
            title="総予算"
            value={totalBudget}
            icon={AssessmentIcon}
            color="secondary"
            formatAsNumber={true}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <StatCard
            title="支出件数"
            value={totalExpenseCount}
            icon={CategoryIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...({} as any)}>
          <StatCard
            title="総支出金額"
            value={totalExpenseAmount}
            icon={CategoryIcon}
            color="warning"
            formatAsNumber={true}
          />
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
          <Button
            variant="outlined"
            startIcon={<StorageIcon />}
            onClick={() => setShowIntegrityChecker(true)}
            color="info"
          >
            ストレージ整合性確認
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
                  <SiteInfoCard
                    site={selectedSite}
                    budget={selectedSiteBudget}
                    categoriesCount={selectedSiteCategories.length}
                    incomeAmount={selectedSiteIncomeAmount}
                    expenseAmount={selectedSiteExpenseAmount}
                    onImageClick={handleImageClick}
                  />
                </Grid>
                <Grid item xs={12} md={6} {...({} as any)}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    カテゴリー一覧
                  </Typography>
                  <CategoryList
                    categories={selectedSiteCategories}
                    siteExpenses={dashboardStats.sites.find(s => s.id === selectedSite.id) ? getSiteExpensesBySite(selectedSite.id) : []}
                    selectedSiteId={selectedSite.id}
                    onImageClick={handleImageClick}
                    onShowAllItems={handleShowCategoryItems}
                  />
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
              disabled={!dashboardStats.selectedSite}
            >
              選択をクリア
            </Button>
          </Box>
          <SiteGrid
            sites={activeSites}
            selectedSiteId={dashboardStats.selectedSite?.id || null}
            onSiteSelect={setSelectedSiteId}
            onImageClick={(src, alt) => handleImageClick(src, alt)}
            getBudgetBySite={getTotalBudgetBySite}
            getCategoriesBySite={getCategoriesBySite}
            getExpensesBySite={getSiteExpensesBySite}
          />
        </Box>
      )}

      {/* 画像拡大表示モーダル */}
      <Dialog
        open={imageModalOpen}
        onClose={handleImageModalClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedImage?.alt || '現場画像'}
            </Typography>
            <IconButton onClick={handleImageModalClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* すべての写真・書類表示モーダル */}
      <Dialog
        open={allItemsModalOpen}
        onClose={handleAllItemsModalClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {allItemsData?.categoryName} - すべての{allItemsData?.type === 'photos' ? '写真' : '書類'}
            </Typography>
            <IconButton onClick={handleAllItemsModalClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {allItemsData?.type === 'photos' ? (
            // 写真の表示
            <Grid container spacing={2}>
              {allItemsData.items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={`photo-${index}`} {...({} as any)}>
                  <Card>
                    <CardContent sx={{ p: 1 }}>
                      <img
                        src={item.src}
                        alt={item.alt}
                        style={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(item.src, item.alt)}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {item.type === 'local' ? 'ローカル' : 'Firebase'} - {item.alt}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // 書類の表示
            <List>
              {allItemsData?.items.map((item, index) => (
                <ListItem 
                  key={`document-${index}`}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'grey.100'
                    },
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1
                  }}
                  onClick={() => {
                    if (item.type === 'local') {
                      // ローカルストレージの書類をダウンロード
                      try {
                        const content = localStorage.getItem(`document_${item.categoryId}_${item.id}`);
                        if (content) {
                          const link = document.createElement('a');
                          link.href = content;
                          link.download = item.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (error) {
                        console.error('書類ダウンロードエラー:', error);
                      }
                    } else {
                      // Firebase Storageの書類を新しいタブで開く
                      window.open(item.url, '_blank');
                    }
                  }}
                >
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    secondary={item.type === 'local' ? 'ローカルストレージ' : 'Firebase Storage'}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* ストレージ整合性チェックモーダル */}
      <StorageIntegrityChecker
        open={showIntegrityChecker}
        onClose={() => setShowIntegrityChecker(false)}
      />
    </Container>
  );
};

export default Dashboard;
