import React, { useState, useEffect } from 'react';
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
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardMedia,
  TextField
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
import SiteDiaryForm from '../components/SiteDiaryForm';
import StatCard from '../components/common/StatCard';
import SiteInfoCard from '../components/common/SiteInfoCard';
import CategoryList from '../components/common/CategoryList';
import SiteGrid from '../components/common/SiteGrid';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useModalManager } from '../hooks/useModalManager';
import { getImageFromLocalStorage } from '../utils/imageUtils';
import { SiteDiary } from '../types';
import { getSiteDiariesBySite, deleteSiteDiaryWithAttachments } from '../utils/siteDiaryFirebase';
import { getAllImagesForDiary } from '../utils/imageUtils';
import { getAllDocumentsForDiary, getDocumentIcon } from '../utils/documentUtils';
import { useAlert } from '../hooks/useAlert';

const Dashboard: React.FC = () => {
  const { setSelectedSiteId, selectedSiteId } = useSites();
  const MEMO_KEY_PREFIX = 'dashboard_memo_site_';
  const [memoText, setMemoText] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 現場変更時のメモロード（初期ロード時も含む）
  useEffect(() => {
    if (!selectedSiteId) {
      console.log('🔄 現場備考: selectedSiteId が null のためメモをクリア');
      setMemoText('');
      return;
    }
    
    const key = MEMO_KEY_PREFIX + selectedSiteId;
    const saved = localStorage.getItem(key);
    console.log('🔄 現場備考: メモロード', { selectedSiteId, key, saved });
    setMemoText(saved || '');
    setIsInitialLoad(false);
  }, [selectedSiteId]);

  // メモの自動保存（初期ロード時は保存しない）
  useEffect(() => {
    if (!selectedSiteId || isInitialLoad) return;
    
    const key = MEMO_KEY_PREFIX + selectedSiteId;
    localStorage.setItem(key, memoText);
    console.log('💾 現場備考: メモ保存', { selectedSiteId, key, memoText });
  }, [memoText, selectedSiteId, isInitialLoad]);

  const handleMemoClear = () => {
    if (!selectedSiteId) return;
    const key = MEMO_KEY_PREFIX + selectedSiteId;
    localStorage.removeItem(key);
    setMemoText('');
  };
  const [showSiteManagement, setShowSiteManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showIntegrityChecker, setShowIntegrityChecker] = useState(false);
  
  // 日記帳関連の状態
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [editingDiary, setEditingDiary] = useState<SiteDiary | null>(null);
  const [diaryFormPresets, setDiaryFormPresets] = useState({ siteId: '', categoryId: '' });
  const [siteDiaries, setSiteDiaries] = useState<SiteDiary[]>([]);
  const [showDiaryDetails, setShowDiaryDetails] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<SiteDiary | null>(null);
  
  // 削除確認ダイアログの状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState<SiteDiary | null>(null);
  
  // 統計データを取得
  const dashboardStats = useDashboardStats();
  
  // アラート機能
  const { showAlert } = useAlert();
  
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
        category.documentIds.forEach((documentId: string) => {
          // TODO: 書類取得の実装を後で追加
          // 現在は書類表示をスキップ
          console.log('書類ID:', documentId, 'の取得は後で実装予定');
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

  // 現場変更時に日記帳データを読み込み
  useEffect(() => {
    const loadDiaries = async () => {
      if (selectedSite) {
        try {
          const diaries = await getSiteDiariesBySite(selectedSite.id);
          setSiteDiaries(diaries);
        } catch (error) {
          console.error('日記帳データの読み込みエラー:', error);
          setSiteDiaries([]);
        }
      } else {
        setSiteDiaries([]);
      }
    };

    loadDiaries();
  }, [selectedSite]);

  // 日記帳作成ハンドラー
  const handleDiaryCreate = (siteId: string, categoryId: string) => {
    setDiaryFormPresets({ siteId, categoryId });
    setEditingDiary(null);
    setShowDiaryForm(true);
  };

  // 日記帳クリックハンドラー
  const handleDiaryClick = (diary: SiteDiary) => {
    setSelectedDiary(diary);
    setShowDiaryDetails(true);
  };

  // 日記帳編集ハンドラー
  const handleDiaryEdit = (diary: SiteDiary) => {
    setEditingDiary(diary);
    setDiaryFormPresets({ siteId: diary.siteId, categoryId: diary.categoryId });
    setShowDiaryForm(true);
    setShowDiaryDetails(false);
  };

  // 日記帳保存時のコールバック
  const handleDiarySaved = (diary: SiteDiary) => {
    // 日記帳リストを更新
    setSiteDiaries(prev => {
      const existingIndex = prev.findIndex(d => d.id === diary.id);
      if (existingIndex >= 0) {
        // 更新
        const updated = [...prev];
        updated[existingIndex] = diary;
        return updated;
      } else {
        // 新規追加
        return [diary, ...prev];
      }
    });
  };

  // 日記帳フォームクローズハンドラー
  const handleDiaryFormClose = () => {
    setShowDiaryForm(false);
    setEditingDiary(null);
    setDiaryFormPresets({ siteId: '', categoryId: '' });
  };

  // 日記帳詳細クローズハンドラー
  const handleDiaryDetailsClose = () => {
    setShowDiaryDetails(false);
    setSelectedDiary(null);
  };

  // 日記帳削除確認ハンドラー
  const handleDiaryDelete = (diary: SiteDiary) => {
    setDiaryToDelete(diary);
    setShowDeleteConfirm(true);
  };

  // 削除確認ダイアログクローズハンドラー
  const handleDeleteConfirmClose = () => {
    setShowDeleteConfirm(false);
    setDiaryToDelete(null);
  };

  // 日記帳削除実行ハンドラー
  const handleConfirmDelete = async () => {
    if (!diaryToDelete) return;

    try {
      console.log('🗑️ 日記帳削除開始:', { id: diaryToDelete.id, title: diaryToDelete.title });
      
      // 添付ファイルと共に完全削除
      await deleteSiteDiaryWithAttachments(diaryToDelete);
      
      // 日記帳リストから削除
      setSiteDiaries(prev => prev.filter(d => d.id !== diaryToDelete.id));
      
      // 詳細表示中の場合は閉じる
      if (selectedDiary?.id === diaryToDelete.id) {
        setShowDiaryDetails(false);
        setSelectedDiary(null);
      }
      
      // 削除確認ダイアログを閉じる
      handleDeleteConfirmClose();
      
      showAlert('success', `日記帳「${diaryToDelete.title}」を削除しました`);
      console.log('✅ 日記帳削除完了:', diaryToDelete.id);
      
    } catch (error) {
      console.error('❌ 日記帳削除エラー:', error);
      showAlert('error', `削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <Card sx={{ width: '100%', maxWidth: 600 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="h6" gutterBottom>現場備考</Typography>
                          <Button size="small" onClick={handleMemoClear}>クリア</Button>
                        </Box>
                        <TextField
                          multiline
                          minRows={6}
                          maxRows={12}
                          fullWidth
                          placeholder="ここに一時的なメモを入力してください"
                          value={memoText}
                          onChange={(e) => setMemoText(e.target.value)}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                    カテゴリー一覧
                  </Typography>
                  <CategoryList
                    categories={selectedSiteCategories}
                    siteExpenses={dashboardStats.sites.find(s => s.id === selectedSite.id) ? getSiteExpensesBySite(selectedSite.id) : []}
                    selectedSiteId={selectedSite.id}
                    siteDiaries={siteDiaries}
                    onImageClick={handleImageClick}
                    onShowAllItems={handleShowCategoryItems}
                    onDiaryCreate={handleDiaryCreate}
                    onDiaryClick={handleDiaryClick}
                    onDiaryDelete={handleDiaryDelete}
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

      {/* 日記帳作成・編集フォーム */}
      <SiteDiaryForm
        open={showDiaryForm}
        onClose={handleDiaryFormClose}
        editingDiary={editingDiary}
        presetSiteId={diaryFormPresets.siteId}
        presetCategoryId={diaryFormPresets.categoryId}
        onSaved={handleDiarySaved}
      />

      {/* 日記帳詳細表示モーダル */}
      <Dialog
        open={showDiaryDetails}
        onClose={handleDiaryDetailsClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">日記帳詳細</Typography>
            <IconButton onClick={handleDiaryDetailsClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDiary && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedDiary.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                記載日: {selectedDiary.recordDate}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3, whiteSpace: 'pre-wrap' }}>
                {selectedDiary.content}
              </Typography>

              {/* 添付画像の表示 */}
              {(() => {
                const images = getAllImagesForDiary({
                  id: selectedDiary.id,
                  imageIds: selectedDiary.imageIds,
                  imageUrls: selectedDiary.imageUrls
                });
                
                if (images.length > 0) {
                  return (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        📷 添付画像 ({images.length}枚)
                      </Typography>
                      <Grid container spacing={2}>
                        {images.map((image, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index} {...({} as any)}>
                            <Card 
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                  boxShadow: 4 
                                }
                              }}
                              onClick={() => handleImageClick(image.src, `日記帳画像 ${index + 1}`)}
                            >
                              <CardMedia
                                component="img"
                                height="120"
                                image={image.src}
                                alt={`日記帳画像 ${index + 1}`}
                                sx={{ objectFit: 'cover' }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: image.type === 'firebase' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(33, 150, 243, 0.8)',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.7rem'
                                }}
                              >
                                {image.type === 'firebase' ? 'クラウド' : 'ローカル'}
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  );
                }
                return null;
              })()}

              {/* 添付書類の表示 */}
              {(() => {
                const documents = getAllDocumentsForDiary({
                  id: selectedDiary.id,
                  documentIds: selectedDiary.documentIds,
                  documentUrls: selectedDiary.documentUrls
                });
                
                if (documents.length > 0) {
                  return (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        📎 添付書類 ({documents.length}件)
                      </Typography>
                      <List>
                        {documents.map((document, index) => (
                          <ListItem 
                            key={index}
                            component="div"
                            onClick={() => {
                              if (document.url) {
                                // Firebase Storage のファイルを新しいタブで開く
                                window.open(document.url, '_blank');
                              } else if (document.data) {
                                // ローカルストレージのファイルをダウンロード
                                const link = window.document.createElement('a');
                                link.href = document.data;
                                link.download = document.fileName;
                                link.click();
                              }
                            }}
                            sx={{
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                          >
                            <ListItemIcon>
                              <Typography fontSize="1.5rem">
                                {getDocumentIcon(document.fileName)}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={document.fileName}
                              secondary={
                                <>
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {document.source === 'firebase' ? 'クラウド保存' : 'ローカル保存'}
                                  </Typography>
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                    {new Date(document.uploadedAt).toLocaleDateString()}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  );
                }
                return null;
              })()}

              <Box mt={3} display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => handleDiaryEdit(selectedDiary)}
                >
                  編集
                </Button>
                <Button
                  variant="text"
                  onClick={handleDiaryDetailsClose}
                >
                  閉じる
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteConfirmClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          日記帳の削除確認
        </DialogTitle>
        <DialogContent>
          {diaryToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                以下の日記帳を削除しますか？
              </Typography>
              <Box sx={{ 
                backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: 1, 
                p: 2, 
                mt: 2 
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {diaryToDelete.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  記載日: {diaryToDelete.recordDate}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {diaryToDelete.content.length > 100 
                    ? `${diaryToDelete.content.substring(0, 100)}...` 
                    : diaryToDelete.content
                  }
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                この操作は元に戻せません。添付された画像や書類も全て削除されます。
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteConfirmClose}
            variant="text"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            autoFocus
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
