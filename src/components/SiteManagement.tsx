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
  Business as BusinessIcon
} from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { Site } from '../types';

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
      if (editingSite) {
        // 更新
        await updateSite(editingSite.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          comment: formData.comment.trim() || undefined,
          isActive: formData.isActive
        });
      } else {
        // 新規作成
        await addSite({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          comment: formData.comment.trim() || undefined,
          isActive: formData.isActive
        });
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

  if (loading) {
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

                    <Typography variant="body2" color="primary">
                      予算合計: ¥{totalBudget.toLocaleString()}
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
          </Box>
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
