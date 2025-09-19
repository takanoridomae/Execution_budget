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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider
} from '@mui/material';
import NumericInput from './common/NumericInput';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  PhotoCamera,
  Delete as DeletePhotoIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useStorageMonitor } from '../hooks/useStorageMonitor';
import { saveSiteImagesHybridBatch, getImageFromLocalStorage } from '../utils/imageUtils';
import { saveDocumentsHybridBatch, getAllDocumentsForEntity, deleteDocumentFromLocalStorage, deleteDocumentFromFirebaseStorage } from '../utils/documentUtils';
import DocumentAttachment, { DocumentInfo } from './common/DocumentAttachment';
import { SiteCategory } from '../types';
import { 
  calculateCurrentMonthCategoryExpenses, 
  calculateCategoryBudgetRemaining,
  calculateCurrentMonthSiteExpenseTotal,
  calculateSiteBudgetRemaining,
  calculateTotalCategoryExpenses,
  calculateTotalSiteExpenses
} from '../utils/transactionCalculations';

interface CategoryFormData {
  siteId: string;
  name: string;
  description: string;
  comment: string;
  budgetAmount: string;
  isActive: boolean;
}

const CategoryManagement: React.FC = () => {
  const { sites, activeSites, selectedSiteId } = useSites();
  const { 
    categories,
    getCategoriesBySite,
    getActiveCategoriesBySite,
    addCategory,
    updateCategory,
    deleteCategory,
    getTotalBudgetBySite,
    loading 
  } = useCategories();
  const { siteExpenses, incomeExpenseLoading } = useTransactions();
  const { storageAlert, dismissAlert, checkAfterImageUpload } = useStorageMonitor();

  // フォーム状態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SiteCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    siteId: selectedSiteId || '',
    name: '',
    description: '',
    comment: '',
    budgetAmount: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [filterSiteId, setFilterSiteId] = useState<string>(selectedSiteId || '');
  
  // 画像関連の状態
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  
  // ダイアログ開始時の初期画像状態を保持（Context更新による影響を受けないように）
  const [initialImageIds, setInitialImageIds] = useState<string[]>([]);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
  
  // 書類関連の状態
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [existingDocumentIds, setExistingDocumentIds] = useState<string[]>([]);
  const [existingDocumentUrls, setExistingDocumentUrls] = useState<string[]>([]);
  const [initialDocumentIds, setInitialDocumentIds] = useState<string[]>([]);
  const [initialDocumentUrls, setInitialDocumentUrls] = useState<string[]>([]);

  // 表示するカテゴリーを取得
  const displayCategories = filterSiteId 
    ? getCategoriesBySite(filterSiteId)
    : categories;

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
      if (imageIdToDelete && editingCategory) {
        console.log('🗑️ ローカル画像削除:', { imageId: imageIdToDelete, categoryId: editingCategory.id });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromLocalStorage(editingCategory.id, imageIdToDelete);
      }
      setExistingImageIds(prev => prev.filter((_, i) => i !== index));
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


  // 書類処理関数
  const handleDocumentFilesSelect = (files: File[]) => {
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const handleDocumentRemove = (document: DocumentInfo, index: number) => {
    if (document.source === 'local' && document.id) {
      // ローカルストレージから即座に削除
      if (editingCategory) {
        deleteDocumentFromLocalStorage(editingCategory.id, document.id);
      }
      setExistingDocumentIds(prev => prev.filter(id => id !== document.id));
    } else if (document.source === 'firebase' && document.url) {
      // Firebase Storageから即座に削除
      deleteDocumentFromFirebaseStorage(document.url).catch((error) => {
        console.warn('⚠️ Firebase書類削除失敗（続行）:', error);
      });
      setExistingDocumentUrls(prev => prev.filter(url => url !== document.url));
    }
  };

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      siteId: filterSiteId || selectedSiteId || '',
      name: '',
      description: '',
      comment: '',
      budgetAmount: '',
      isActive: true
    });
    setFormErrors({});
    setEditingCategory(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImageIds([]);
    setExistingImageUrls([]);
    setInitialImageIds([]);
    setInitialImageUrls([]);
    setDocumentFiles([]);
    setExistingDocumentIds([]);
    setExistingDocumentUrls([]);
    setInitialDocumentIds([]);
    setInitialDocumentUrls([]);
  };

  // ダイアログを開く
  const handleOpenDialog = (category?: SiteCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        siteId: category.siteId,
        name: category.name,
        description: category.description || '',
        comment: category.comment || '',
        budgetAmount: category.budgetAmount.toString(),
        isActive: category.isActive
      });
      
      // 既存の画像データを設定（ダイアログが開かれる時点での状態を保持）
      const initialIds = [...(category.imageIds || [])];
      const initialUrls = [...(category.imageUrls || [])];
      
      setExistingImageIds(initialIds);
      setExistingImageUrls(initialUrls);
      setInitialImageIds(initialIds);
      setInitialImageUrls(initialUrls);
      setImageFiles([]);
      setImagePreviews([]);
      
      // 既存の書類データを設定
      const initialDocIds = [...(category.documentIds || [])];
      const initialDocUrls = [...(category.documentUrls || [])];
      
      setExistingDocumentIds(initialDocIds);
      setExistingDocumentUrls(initialDocUrls);
      setInitialDocumentIds(initialDocIds);
      setInitialDocumentUrls(initialDocUrls);
      setDocumentFiles([]);
      
      console.log('🎯 カテゴリーダイアログ開始時の画像データ:', {
        categoryId: category.id,
        initialImageIds: initialIds,
        initialImageUrls: initialUrls
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
  const handleInputChange = (field: keyof CategoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.siteId) {
      errors.siteId = '現場を選択してください';
    }
    if (!formData.name.trim()) {
      errors.name = 'カテゴリー名は必須です';
    }
    const budgetAmount = Number(formData.budgetAmount);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      errors.budgetAmount = '予算額は0以上の数値である必要があります';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // カテゴリー保存
  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    try {
      let categoryId: string;
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];

      // 基本情報の保存
      const categoryData = {
        siteId: formData.siteId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        comment: formData.comment.trim() || undefined,
        budgetAmount: Number(formData.budgetAmount),
        isActive: formData.isActive
      };

      if (editingCategory) {
        // 更新の場合
        categoryId = editingCategory.id;
        await updateCategory(categoryId, categoryData);
      } else {
        // 新規作成の場合
        categoryId = await addCategory(categoryData);
      }

      // 画像がある場合は保存処理
      if (imageFiles && imageFiles.length > 0) {
        try {
          const results = await saveSiteImagesHybridBatch(categoryId, imageFiles);
          
          newImageIds = results.filter(r => r.imageId).map(r => r.imageId!);
          newImageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
          
          const saveReport = `カテゴリー画像保存完了: ${results.length}枚 (ローカル: ${results.filter(r => r.saveMethod === 'local').length}枚, Firebase: ${results.filter(r => r.saveMethod === 'firebase').length}枚)`;

          console.log('🖼️ カテゴリー画像保存結果:', {
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
      
      // 書類がある場合は保存処理
      let newDocumentIds: string[] = [];
      let newDocumentUrls: string[] = [];
      
      if (documentFiles && documentFiles.length > 0) {
        try {
          const docResults = await saveDocumentsHybridBatch(categoryId, documentFiles, 'categories');
          
          newDocumentIds = docResults.filter(r => r.documentId).map(r => r.documentId!);
          newDocumentUrls = docResults.filter(r => r.documentUrl).map(r => r.documentUrl!);
          
          console.log('📄 カテゴリー書類保存結果:', {
            documentIds: newDocumentIds,
            documentUrls: newDocumentUrls,
            保存数: docResults.length
          });
        } catch (documentError) {
          console.error('書類保存エラー:', documentError);
          // 書類保存エラーは致命的ではないため、続行
        }
      }

      if (editingCategory) {
        // 編集時：削除された画像を実際にストレージから削除
        const deletedImageIds = initialImageIds.filter(id => !existingImageIds.includes(id));
        const deletedImageUrls = initialImageUrls.filter(url => !existingImageUrls.includes(url));
        
        console.log('🗑️ カテゴリー削除対象の画像:', {
          削除されたImageIDs: deletedImageIds,
          削除されたImageURLs: deletedImageUrls,
          削除前初期状態: { imageIds: initialImageIds, imageUrls: initialImageUrls },
          削除後現在状態: { imageIds: existingImageIds, imageUrls: existingImageUrls }
        });
        
        // 削除された画像をストレージから実際に削除
        for (const imageId of deletedImageIds) {
          try {
            const { deleteImageFromLocalStorage } = require('../utils/imageUtils');
            deleteImageFromLocalStorage(editingCategory.id, imageId);
            console.log('✅ カテゴリーローカル画像削除:', imageId);
          } catch (error) {
            console.error('❌ カテゴリーローカル画像削除エラー:', imageId, error);
          }
        }
        
        for (const imageUrl of deletedImageUrls) {
          try {
            const { deleteImageFromFirebaseStorage } = require('../utils/imageUtils');
            await deleteImageFromFirebaseStorage(imageUrl);
            console.log('✅ カテゴリーFirebase画像削除:', imageUrl);
          } catch (error) {
            console.error('❌ カテゴリーFirebase画像削除エラー:', imageUrl, error);
          }
        }
        
        // 存在しないローカル画像IDを除外（表示されていない画像を自動削除）
        const validImageIds = existingImageIds.filter(imageId => {
          const { getImageFromLocalStorage } = require('../utils/imageUtils');
          const exists = getImageFromLocalStorage(editingCategory.id, imageId) !== null;
          if (!exists) {
            console.log('🗑️ カテゴリー存在しないローカル画像IDを除外:', { imageId, categoryId: editingCategory.id });
          }
          return exists;
        });
        
        // 書類削除処理
        const deletedDocumentIds = initialDocumentIds.filter(id => !existingDocumentIds.includes(id));
        const deletedDocumentUrls = initialDocumentUrls.filter(url => !existingDocumentUrls.includes(url));
        
        console.log('🗑️ カテゴリー削除対象の書類:', {
          削除されたDocumentIDs: deletedDocumentIds,
          削除されたDocumentURLs: deletedDocumentUrls
        });
        
        // 削除された書類をストレージから実際に削除
        for (const documentId of deletedDocumentIds) {
          try {
            deleteDocumentFromLocalStorage(editingCategory.id, documentId);
            console.log('✅ カテゴリーローカル書類削除:', documentId);
          } catch (error) {
            console.error('❌ カテゴリーローカル書類削除エラー:', documentId, error);
          }
        }
        
        for (const documentUrl of deletedDocumentUrls) {
          try {
            await deleteDocumentFromFirebaseStorage(documentUrl);
            console.log('✅ カテゴリーFirebase書類削除:', documentUrl);
          } catch (error) {
            console.error('❌ カテゴリーFirebase書類削除エラー:', documentUrl, error);
          }
        }

        // 最終的な画像データ（有効な既存 + 新規追加）
        const finalImageIds = [...validImageIds, ...newImageIds];
        const finalImageUrls = [...existingImageUrls, ...newImageUrls];
        
        // 最終的な書類データ（有効な既存 + 新規追加）
        const finalDocumentIds = [...existingDocumentIds, ...newDocumentIds];
        const finalDocumentUrls = [...existingDocumentUrls, ...newDocumentUrls];
        
        console.log('🔍 カテゴリーローカル画像ID検証結果:', {
          元のexistingImageIds: existingImageIds,
          検証後validImageIds: validImageIds,
          除外されたID数: existingImageIds.length - validImageIds.length
        });
        
        const updateData: any = {
          imageIds: finalImageIds, // 削除が反映された最終状態
          imageUrls: finalImageUrls, // 削除が反映された最終状態
          documentIds: finalDocumentIds, // 削除が反映された最終状態
          documentUrls: finalDocumentUrls // 削除が反映された最終状態
        };
        
        console.log('🖼️ カテゴリーDB更新最終データ:', {
          初期状態imageIds: initialImageIds,
          削除後既存imageIds: existingImageIds,
          新規追加imageIds: newImageIds,
          最終DBへ保存imageIds: finalImageIds
        });
        
        await updateCategory(categoryId, updateData);
        
      } else {
        // 新規作成時：画像・書類がある場合のみ更新
        const allImageIds = [...existingImageIds, ...newImageIds];
        const allImageUrls = [...existingImageUrls, ...newImageUrls];
        const allDocumentIds = [...existingDocumentIds, ...newDocumentIds];
        const allDocumentUrls = [...existingDocumentUrls, ...newDocumentUrls];
        
        if (allImageIds.length > 0 || allImageUrls.length > 0 || allDocumentIds.length > 0 || allDocumentUrls.length > 0) {
          const updateData: any = {};
          if (allImageIds.length > 0) updateData.imageIds = allImageIds;
          if (allImageUrls.length > 0) updateData.imageUrls = allImageUrls;
          if (allDocumentIds.length > 0) updateData.documentIds = allDocumentIds;
          if (allDocumentUrls.length > 0) updateData.documentUrls = allDocumentUrls;
          
          await updateCategory(categoryId, updateData);
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('カテゴリー保存エラー:', error);
    }
  };

  // カテゴリー削除
  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('このカテゴリーを削除してもよろしいですか？')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('カテゴリー削除エラー:', error);
      }
    }
  };

  // 現場名を取得
  const getSiteName = (siteId: string): string => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : '不明な現場';
  };

  // カテゴリーの支出実績と予算残額を計算
  const getCategoryFinancials = (category: SiteCategory) => {
    const actualExpenses = calculateTotalCategoryExpenses(
      siteExpenses,
      category.id,
      category.siteId
    );
    const budgetRemaining = calculateCategoryBudgetRemaining(
      category.budgetAmount,
      actualExpenses
    );
    
    return {
      actualExpenses,
      budgetRemaining,
      budgetUsagePercent: category.budgetAmount > 0 
        ? Math.round((actualExpenses / category.budgetAmount) * 100)
        : 0
    };
  };

  if (loading || incomeExpenseLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>カテゴリーデータを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CategoryIcon color="primary" />
          <Typography variant="h5" component="h2">
            カテゴリー管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={activeSites.length === 0}
        >
          新しいカテゴリーを追加
        </Button>
      </Box>

      {/* フィルター */}
      <Box mb={3}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>現場でフィルター</InputLabel>
          <Select
            value={filterSiteId}
            onChange={(e) => setFilterSiteId(e.target.value)}
            label="現場でフィルター"
          >
            <MenuItem value="">すべての現場</MenuItem>
            {activeSites.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 現場がない場合の警告 */}
      {activeSites.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          アクティブな現場がありません。まず現場を登録してください。
        </Alert>
      )}

      {/* カテゴリー一覧 */}
      {displayCategories.length === 0 ? (
        <Alert severity="info">
          {filterSiteId 
            ? 'この現場にはカテゴリーが登録されていません。' 
            : 'カテゴリーが登録されていません。'
          }「新しいカテゴリーを追加」ボタンから追加してください。
        </Alert>
      ) : (
        <>
          {/* 現場別カテゴリー表示 */}
          {activeSites
            .filter(site => !filterSiteId || site.id === filterSiteId)
            .map((site) => {
              const siteCategories = getCategoriesBySite(site.id);
              const totalBudget = getTotalBudgetBySite(site.id);
              
              if (siteCategories.length === 0) return null;

              const siteExpenseTotal = calculateTotalSiteExpenses(siteExpenses, site.id);
              const siteBudgetRemaining = calculateSiteBudgetRemaining(totalBudget, siteExpenseTotal);
              const isSiteOverBudget = siteBudgetRemaining < 0;
              
              return (
                <Box key={site.id} mb={4}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6">{site.name}</Typography>
                    <Chip 
                      label={`合計予算: ¥${totalBudget.toLocaleString()}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={`実績合計（累計）: ¥${siteExpenseTotal.toLocaleString()}`}
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip 
                      label={`予算残: ¥${siteBudgetRemaining.toLocaleString()}${isSiteOverBudget ? ' (予算超過)' : ''}`}
                      color={isSiteOverBudget ? "error" : "success"}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    {siteCategories.map((category) => {
                      const financials = getCategoryFinancials(category);
                      const isOverBudget = financials.budgetRemaining < 0;
                      
                      return (
                        <Grid key={category.id} item xs={12} sm={6} md={4} {...({} as any)}>
                          <Card elevation={2}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Typography variant="h6" component="h3" noWrap>
                                  {category.name}
                                </Typography>
                                <Box display="flex" gap={0.5}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleOpenDialog(category)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteCategory(category.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              <Box mb={1}>
                                <Chip 
                                  label={category.isActive ? '有効' : '無効'}
                                  color={category.isActive ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>

                              {category.description && (
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                  {category.description}
                                </Typography>
                              )}

                              <Typography variant="body2" color="primary" fontWeight="bold" mb={1}>
                                予算: ¥{category.budgetAmount.toLocaleString()}
                              </Typography>

                              <Typography variant="body2" color="text.secondary" mb={1}>
                                支出実績: ¥{financials.actualExpenses.toLocaleString()}
                              </Typography>

                              <Typography 
                                variant="body2" 
                                color={isOverBudget ? 'error' : 'success'}
                                fontWeight="bold"
                                mb={1}
                              >
                                予算残: ¥{financials.budgetRemaining.toLocaleString()}
                                {isOverBudget && ' (予算超過)'}
                              </Typography>

                              <Box mb={1}>
                                <Typography variant="caption" color="text.secondary">
                                  予算使用率: {financials.budgetUsagePercent}%
                                </Typography>
                                <Box 
                                  sx={{ 
                                    width: '100%', 
                                    height: 6, 
                                    backgroundColor: 'grey.300',
                                    borderRadius: 1,
                                    mt: 0.5
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${Math.min(financials.budgetUsagePercent, 100)}%`,
                                      height: '100%',
                                      backgroundColor: isOverBudget ? 'error.main' : 
                                        financials.budgetUsagePercent > 80 ? 'warning.main' : 'success.main',
                                      borderRadius: 1,
                                    }}
                                  />
                                </Box>
                              </Box>

                              {/* 写真表示セクション */}
                              {((category.imageIds && category.imageIds.length > 0) || 
                                (category.imageUrls && category.imageUrls.length > 0)) && (
                                <Box mb={1}>
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <ImageIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      写真登録済み
                                    </Typography>
                                  </Box>
                                  <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {/* ローカルストレージの画像 */}
                                    {category.imageIds && category.imageIds.slice(0, 3).map((imageId, index) => {
                                      const imageData = getImageFromLocalStorage(category.id, imageId);
                                      if (!imageData) return null;
                                      return (
                                        <img
                                          key={`category-local-${index}`}
                                          src={imageData}
                                          alt={`カテゴリー画像-${index}`}
                                          style={{
                                            width: 32,
                                            height: 32,
                                            objectFit: 'cover',
                                            borderRadius: 4,
                                            border: '1px solid #ddd'
                                          }}
                                        />
                                      );
                                    })}
                                    
                                    {/* Firebase Storageの画像 */}
                                    {category.imageUrls && category.imageUrls.slice(0, 3).map((url, index) => (
                                      <img
                                        key={`category-firebase-${index}`}
                                        src={url}
                                        alt={`カテゴリー画像-${index}`}
                                        style={{
                                          width: 32,
                                          height: 32,
                                          objectFit: 'cover',
                                          borderRadius: 4,
                                          border: '1px solid #ddd'
                                        }}
                                      />
                                    ))}
                                    
                                    {/* 追加画像がある場合の表示 */}
                                    {((category.imageIds?.length || 0) + (category.imageUrls?.length || 0)) > 3 && (
                                      <Box
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          backgroundColor: 'grey.200',
                                          borderRadius: 1,
                                          border: '1px solid #ddd'
                                        }}
                                      >
                                        <Typography variant="caption" color="text.secondary" fontSize="10px">
                                          +{((category.imageIds?.length || 0) + (category.imageUrls?.length || 0)) - 3}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* 書類表示セクション */}
                              {((category.documentIds && category.documentIds.length > 0) || 
                                (category.documentUrls && category.documentUrls.length > 0)) && (
                                <Box mb={1}>
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <AttachFileIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      書類登録済み ({(category.documentIds?.length || 0) + (category.documentUrls?.length || 0)}件)
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {category.comment && (
                                <Typography variant="body2" color="text.secondary" mt={1}>
                                  💬 {category.comment}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  <Divider sx={{ mt: 3 }} />
                </Box>
              );
            })}
        </>
      )}

      {/* カテゴリー追加・編集ダイアログ */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'カテゴリー編集' : '新しいカテゴリーを追加'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl 
              fullWidth
              error={!!formErrors.siteId}
              disabled={!!editingCategory}
            >
              <InputLabel>現場</InputLabel>
              <Select
                value={formData.siteId}
                onChange={(e) => handleInputChange('siteId', e.target.value)}
                label="現場"
              >
                {activeSites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.siteId && (
                <Typography variant="caption" color="error">
                  {formErrors.siteId}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="カテゴリー名"
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

            <NumericInput
              label="予算額"
              value={formData.budgetAmount}
              onChange={(value) => handleInputChange('budgetAmount', value)}
              error={!!formErrors.budgetAmount}
              helperText={formErrors.budgetAmount}
              required
              fullWidth
            />

            <TextField
              label="コメント"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              multiline
              rows={3}
              placeholder="カテゴリーに関する追加情報やメモを入力..."
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="このカテゴリーを有効にする"
            />

            {/* 画像アップロード機能 */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                カテゴリー写真
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
                      const imageData = editingCategory ? getImageFromLocalStorage(editingCategory.id, imageId) : null;
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
                カテゴリーの参考画像（見本、仕様書など）をアップロードできます。
              </Typography>
            </Box>

            {/* 書類アップロード機能 */}
            <DocumentAttachment
              entityId={editingCategory?.id || 'new-category'}
              documents={[
                // 既存のローカル書類
                ...existingDocumentIds.map(id => {
                  const doc = editingCategory ? getAllDocumentsForEntity(editingCategory.id).find(d => d.id === id) : null;
                  return doc ? {
                    id,
                    fileName: doc.fileName,
                    fileType: doc.fileType,
                    uploadedAt: doc.uploadedAt,
                    source: 'local' as const
                  } : null;
                }).filter(Boolean) as DocumentInfo[],
                // 既存のFirebase書類
                ...existingDocumentUrls.map(url => ({
                  url,
                  fileName: url.split('/').pop()?.split('_').slice(1).join('_') || 'document',
                  fileType: 'application/octet-stream',
                  uploadedAt: new Date().toISOString(),
                  source: 'firebase' as const
                })),
                // 新しく選択された書類
                ...documentFiles.map(file => ({
                  fileName: file.name,
                  fileType: file.type,
                  uploadedAt: new Date().toISOString(),
                  source: 'local' as const,
                  size: file.size,
                  file: file
                }))
              ]}
              onDocumentsChange={(docs) => {
                // 新しく選択されたファイルのみを抽出
                const newFileDocuments = docs.filter(doc => doc.file);
                const files = newFileDocuments.map(doc => doc.file!);
                setDocumentFiles(files);
              }}
              onFilesSelect={handleDocumentFilesSelect}
              onDocumentRemove={handleDocumentRemove}
              label="カテゴリー書類を添付"
              helperText="仕様書、設計書、見本写真、契約書などの書類をアップロードできます。"
            />
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
          <Button onClick={handleSaveCategory} variant="contained">
            {editingCategory ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagement;
