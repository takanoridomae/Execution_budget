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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { SiteCategory } from '../types';

interface CategoryFormData {
  siteId: string;
  name: string;
  description: string;
  comment: string;
  budgetAmount: number;
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

  // フォーム状態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SiteCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    siteId: selectedSiteId || '',
    name: '',
    description: '',
    comment: '',
    budgetAmount: 0,
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [filterSiteId, setFilterSiteId] = useState<string>(selectedSiteId || '');

  // 表示するカテゴリーを取得
  const displayCategories = filterSiteId 
    ? getCategoriesBySite(filterSiteId)
    : categories;

  // フォームのリセット
  const resetForm = () => {
    setFormData({
      siteId: filterSiteId || selectedSiteId || '',
      name: '',
      description: '',
      comment: '',
      budgetAmount: 0,
      isActive: true
    });
    setFormErrors({});
    setEditingCategory(null);
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
        budgetAmount: category.budgetAmount,
        isActive: category.isActive
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
    if (formData.budgetAmount < 0) {
      errors.budgetAmount = '予算額は0以上である必要があります';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // カテゴリー保存
  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    try {
      if (editingCategory) {
        // 更新
        await updateCategory(editingCategory.id, {
          siteId: formData.siteId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          comment: formData.comment.trim() || undefined,
          budgetAmount: formData.budgetAmount,
          isActive: formData.isActive
        });
      } else {
        // 新規作成
        await addCategory({
          siteId: formData.siteId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          comment: formData.comment.trim() || undefined,
          budgetAmount: formData.budgetAmount,
          isActive: formData.isActive
        });
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

  if (loading) {
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
                  </Box>
                  
                  <Grid container spacing={2}>
                    {siteCategories.map((category) => (
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

                            <Typography variant="body2" color="primary" fontWeight="bold">
                              予算: ¥{category.budgetAmount.toLocaleString()}
                            </Typography>

                            {category.comment && (
                              <Typography variant="body2" color="text.secondary" mt={1}>
                                💬 {category.comment}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
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

            <TextField
              label="予算額"
              type="number"
              value={formData.budgetAmount}
              onChange={(e) => handleInputChange('budgetAmount', Number(e.target.value))}
              error={!!formErrors.budgetAmount}
              helperText={formErrors.budgetAmount}
              required
              fullWidth
              InputProps={{
                startAdornment: '¥'
              }}
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
          </Box>
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
