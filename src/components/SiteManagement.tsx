import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  PhotoCamera,
  Delete as DeletePhotoIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useStorageMonitor } from '../hooks/useStorageMonitor';
import { saveSiteImagesHybridBatch, getImageFromLocalStorage } from '../utils/imageUtils';
import { Site } from '../types';
import { 
  calculateCurrentMonthSiteExpenseTotal, 
  calculateSiteBudgetRemaining 
} from '../utils/transactionCalculations';

interface SiteFormData {
  name: string;
  description: string;
  comment: string;
  isActive: boolean;
}

const SiteManagement: React.FC = () => {
  const { 
    sites, 
    activeSites, 
    selectedSiteId, 
    addSite, 
    updateSite, 
    deleteSite, 
    setSelectedSiteId,
    loading 
  } = useSites();
  
  const { getTotalBudgetBySite } = useCategories();
  const { siteExpenses, incomeExpenseLoading } = useTransactions();
  const { storageAlert, dismissAlert, checkAfterImageUpload } = useStorageMonitor();

  // フォーム状態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    description: '',
    comment: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // 画像関連の状態
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  // ダイアログ開始時の初期画像状態を保持（Context更新による影響を受けないように）
  const [initialImageIds, setInitialImageIds] = useState<string[]>([]);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);

  // 画像処理関数
  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const nextFiles = [...imageFiles, ...fileArray].slice(0, 5); // 最大5枚制限
    
    const previews = await Promise.all(
      nextFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    
    setImageFiles(nextFiles);
    setImagePreviews(previews);
  };

  const handleImageRemove = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleExistingImageRemove = (index: number, type: 'local' | 'firebase') => {
    if (type === 'local') {
      // ローカルストレージから即座に削除
      const imageIdToDelete = existingImageIds[index];
      if (imageIdToDelete && editingSite) {
        console.log('🗑️ ローカル画像削除開始:', { 
          imageId: imageIdToDelete, 
          siteId: editingSite.id,
          削除前のexistingImageIds: existingImageIds
        });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromLocalStorage(editingSite.id, imageIdToDelete);
      }
      const newImageIds = existingImageIds.filter((_, i) => i !== index);
      setExistingImageIds(newImageIds);
      console.log('🗑️ ローカル画像ID状態更新:', { 
        削除前: existingImageIds,
        削除後: newImageIds
      });
    } else {
      // Firebase Storageから即座に削除
      const imageUrlToDelete = existingImageUrls[index];
      if (imageUrlToDelete) {
        console.log('🗑️ Firebase画像削除:', { imageUrl: imageUrlToDelete });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromFirebaseStorage(imageUrlToDelete).catch((error: any) => {
          console.warn('⚠️ Firebase画像削除失敗（続行）:', error);
        });
      }
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    }
  };


  // フォームのリセット
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      comment: '',
      isActive: true
    });
    setFormErrors({});
    setEditingSite(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImageIds([]);
    setExistingImageUrls([]);
    setInitialImageIds([]);
    setInitialImageUrls([]);
  };

  // ダイアログを開く
  const handleOpenDialog = (site?: Site) => {
    if (site) {
      setEditingSite(site);
      setFormData({
        name: site.name,
        description: site.description || '',
        comment: site.comment || '',
        isActive: site.isActive
      });
      
      // 既存の画像データを設定（ダイアログが開かれる時点での状態を保持）
      const initialIds = [...(site.imageIds || [])];
      const initialUrls = [...(site.imageUrls || [])];
      
      setExistingImageIds(initialIds);
      setExistingImageUrls(initialUrls);
      setInitialImageIds(initialIds);
      setInitialImageUrls(initialUrls);
      setImageFiles([]);
      setImagePreviews([]);
      
      console.log('🎯 ダイアログ開始時の画像データ:', {
        siteId: site.id,
        initialImageIds: initialIds,
        initialImageUrls: initialUrls,
        DBの元データ: {
          imageIds: site.imageIds,
          imageUrls: site.imageUrls
        }
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  // フォーム入力変更
  const handleInputChange = (field: keyof SiteFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = '現場名は必須です';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 現場保存
  const handleSaveSite = async () => {
    if (!validateForm()) return;

    try {
      let siteId: string;
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];

      // 基本情報の保存
      const siteData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        comment: formData.comment.trim() || undefined,
        isActive: formData.isActive
      };

      if (editingSite) {
        // 更新の場合
        siteId = editingSite.id;
        await updateSite(siteId, siteData);
      } else {
        // 新規作成の場合
        siteId = await addSite(siteData);
      }

      // 画像がある場合は保存処理
      if (imageFiles && imageFiles.length > 0) {
        try {
          const results = await saveSiteImagesHybridBatch(siteId, imageFiles);
          
          newImageIds = results.filter(r => r.imageId).map(r => r.imageId!);
          newImageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
          
          const saveReport = `現場画像保存完了: ${results.length}枚 (ローカル: ${results.filter(r => r.saveMethod === 'local').length}枚, Firebase: ${results.filter(r => r.saveMethod === 'firebase').length}枚)`;

          console.log('🖼️ 現場画像保存結果:', {
            imageIds: newImageIds,
            imageUrls: newImageUrls,
            report: saveReport
          });

          // 画像アップロード後にストレージ使用量をチェック
          checkAfterImageUpload();
        } catch (imageError) {
          console.error('画像保存エラー:', imageError);
          // 画像保存エラーは致命的ではないため、続行
        }
      }

      if (editingSite) {
        // 編集時：削除された画像を実際にストレージから削除
        const deletedImageIds = initialImageIds.filter(id => !existingImageIds.includes(id));
        const deletedImageUrls = initialImageUrls.filter(url => !existingImageUrls.includes(url));
        
        console.log('🗑️ 削除対象の画像:', {
          削除されたImageIDs: deletedImageIds,
          削除されたImageURLs: deletedImageUrls,
          削除前初期状態: { imageIds: initialImageIds, imageUrls: initialImageUrls },
          削除後現在状態: { imageIds: existingImageIds, imageUrls: existingImageUrls }
        });
        
        // 削除された画像をストレージから実際に削除
        for (const imageId of deletedImageIds) {
          try {
            const { deleteImageFromLocalStorage } = require('../utils/imageUtils');
            deleteImageFromLocalStorage(editingSite.id, imageId);
            console.log('✅ ローカル画像削除:', imageId);
          } catch (error) {
            console.error('❌ ローカル画像削除エラー:', imageId, error);
          }
        }
        
        for (const imageUrl of deletedImageUrls) {
          try {
            const { deleteImageFromFirebaseStorage } = require('../utils/imageUtils');
            await deleteImageFromFirebaseStorage(imageUrl);
            console.log('✅ Firebase画像削除:', imageUrl);
          } catch (error) {
            console.error('❌ Firebase画像削除エラー:', imageUrl, error);
          }
        }
        
        // 存在しないローカル画像IDを除外（表示されていない画像を自動削除）
        const validImageIds = existingImageIds.filter(imageId => {
          const { getImageFromLocalStorage } = require('../utils/imageUtils');
          const exists = getImageFromLocalStorage(editingSite.id, imageId) !== null;
          if (!exists) {
            console.log('🗑️ 存在しないローカル画像IDを除外:', { imageId, siteId: editingSite.id });
          }
          return exists;
        });
        
        // 最終的な画像データ（有効な既存 + 新規追加）
        const finalImageIds = [...validImageIds, ...newImageIds];
        const finalImageUrls = [...existingImageUrls, ...newImageUrls];
        
        console.log('🔍 ローカル画像ID検証結果:', {
          元のexistingImageIds: existingImageIds,
          検証後validImageIds: validImageIds,
          除外されたID数: existingImageIds.length - validImageIds.length
        });
        
        const updateData: any = {
          imageIds: finalImageIds, // 削除が反映された最終状態
          imageUrls: finalImageUrls // 削除が反映された最終状態
        };
        
        console.log('🖼️ DB更新最終データ:', {
          初期状態imageIds: initialImageIds,
          削除後既存imageIds: existingImageIds,
          新規追加imageIds: newImageIds,
          最終DBへ保存imageIds: finalImageIds
        });
        
        await updateSite(siteId, updateData);
        
        console.log('💾 現場データ更新完了、Context状態確認:', {
          siteId,
          更新後のSiteデータ: sites.find(s => s.id === siteId),
          更新内容: updateData
        });
        
      } else {
        // 新規作成時：画像がある場合のみ更新
        const allImageIds = [...existingImageIds, ...newImageIds];
        const allImageUrls = [...existingImageUrls, ...newImageUrls];
        
        if (allImageIds.length > 0 || allImageUrls.length > 0) {
          const updateData: any = {};
          if (allImageIds.length > 0) updateData.imageIds = allImageIds;
          if (allImageUrls.length > 0) updateData.imageUrls = allImageUrls;
          
          await updateSite(siteId, updateData);
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('現場保存エラー:', error);
    }
  };

  // 現場削除
  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('この現場を削除してもよろしいですか？')) {
      try {
        await deleteSite(siteId);
      } catch (error) {
        console.error('現場削除エラー:', error);
      }
    }
  };

  // 現場選択
  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId === selectedSiteId ? null : siteId);
  };

  if (loading || incomeExpenseLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>現場データを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon color="primary" />
          <Typography variant="h5" component="h2">
            現場管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新しい現場を追加
        </Button>
      </Box>

      {/* 現場一覧 */}
      {sites.length === 0 ? (
        <Alert severity="info">
          現場が登録されていません。「新しい現場を追加」ボタンから追加してください。
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {sites.map((site) => {
            const totalBudget = getTotalBudgetBySite(site.id);
            const siteExpenseTotal = calculateCurrentMonthSiteExpenseTotal(siteExpenses, site.id);
            const siteBudgetRemaining = calculateSiteBudgetRemaining(totalBudget, siteExpenseTotal);
            const isSiteOverBudget = siteBudgetRemaining < 0;
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
                  onClick={() => handleSelectSite(site.id)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h3" noWrap>
                        {site.name}
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(site);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSite(site.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box mb={1}>
                      <Chip 
                        label={site.isActive ? '稼働中' : '停止中'}
                        color={site.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    {site.description && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {site.description}
                      </Typography>
                    )}

                    <Typography variant="body2" color="primary" mb={1}>
                      予算合計: ¥{totalBudget.toLocaleString()}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      支出合計: ¥{siteExpenseTotal.toLocaleString()}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      color={isSiteOverBudget ? 'error' : 'success'}
                      fontWeight="bold"
                      mb={1}
                    >
                      予算残: ¥{siteBudgetRemaining.toLocaleString()}
                      {isSiteOverBudget && ' (予算超過)'}
                    </Typography>

                    {site.comment && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        💬 {site.comment}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 現場追加・編集ダイアログ */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSite ? '現場編集' : '新しい現場を追加'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="現場名"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              fullWidth
            />

            <TextField
              label="説明"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="コメント"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              multiline
              rows={3}
              placeholder="現場に関する追加情報やメモを入力..."
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="この現場を有効にする"
            />

            {/* 画像アップロード機能 */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                現場写真
              </Typography>

              {/* 既存画像の表示 */}
              {(existingImageIds.length > 0 || existingImageUrls.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    既存の画像
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {/* ローカルストレージの画像 */}
                    {existingImageIds.map((imageId, index) => {
                      const imageData = editingSite ? getImageFromLocalStorage(editingSite.id, imageId) : null;
                      if (!imageData) return null;
                      return (
                        <Box key={`existing-local-${index}`} position="relative" display="inline-block">
                          <img
                            src={imageData}
                            alt={`existing-${index}`}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #ddd'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleExistingImageRemove(index, 'local')}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'error.main',
                              color: 'white',
                              '&:hover': { backgroundColor: 'error.dark' }
                            }}
                          >
                            <DeletePhotoIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                    
                    {/* Firebase Storageの画像 */}
                    {existingImageUrls.map((url, index) => (
                      <Box key={`existing-firebase-${index}`} position="relative" display="inline-block">
                        <img
                          src={url}
                          alt={`existing-firebase-${index}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleExistingImageRemove(index, 'firebase')}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'error.dark' }
                          }}
                        >
                          <DeletePhotoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 新しい画像のプレビュー */}
              {imagePreviews.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    追加する画像 ({imagePreviews.length}/5枚)
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {imagePreviews.map((src, index) => (
                      <Box key={index} position="relative" display="inline-block">
                        <img
                          src={src}
                          alt={`upload-${index}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageRemove(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'error.dark' }
                          }}
                        >
                          <DeletePhotoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* ファイル選択ボタン */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={imageFiles.length >= 5}
                sx={{ mb: 1 }}
              >
                写真を選択
                <input
                  type="file"
                  accept="image/*" 
                  multiple
                  hidden
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
              </Button>
              
              {imageFiles.length >= 5 && (
                <Typography variant="caption" color="error" display="block">
                  画像は最大5枚まで選択できます
                </Typography>
              )}
              
              <Typography variant="caption" color="textSecondary" display="block">
                現場の写真（図面、現状写真など）をアップロードできます。
              </Typography>
            </Box>
          </Box>

          {/* ストレージアラート */}
          {storageAlert.shouldShowAlert && (
            <Alert 
              severity={storageAlert.level} 
              onClose={dismissAlert}
              sx={{ mt: 2 }}
            >
              {storageAlert.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button onClick={handleSaveSite} variant="contained">
            {editingSite ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiteManagement;
