import React, { useEffect, useState } from 'react';
import { Alert, Button, Box, CircularProgress, Typography } from '@mui/material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { createAllSampleData } from '../utils/sampleData';

const DataInitializer: React.FC = () => {
  const { sites, loading: sitesLoading } = useSites();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeSites = sites.filter(site => site.isActive);
  const hasData = activeSites.length > 0 && categories.length > 0;
  const isLoading = sitesLoading || categoriesLoading;
  
  // デバッグ情報
  console.log('📋 DataInitializer Debug:', {
    sitesTotal: sites.length,
    activeSites: activeSites.length,
    categoriesTotal: categories.length,
    hasData,
    isLoading
  });

  const handleCreateSampleData = async () => {
    setIsCreating(true);
    setError(null);
    try {
      await createAllSampleData();
      setSuccess(true);
      setTimeout(() => {
        window.location.reload(); // データ作成後にページをリロード
      }, 2000);
    } catch (err) {
      console.error('❌ サンプルデータ作成エラー:', err);
      setError('サンプルデータの作成に失敗しました。');
    } finally {
      setIsCreating(false);
    }
  };

  // データが読み込み中の場合は何も表示しない
  if (isLoading) {
    return null;
  }

  // データが存在する場合は何も表示しない
  if (hasData) {
    return null;
  }

  // 成功メッセージの表示
  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography>
          ✅ サンプルデータを作成しました！ページを再読み込み中...
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert 
      severity="info" 
      sx={{ mb: 2 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={handleCreateSampleData}
          disabled={isCreating}
          startIcon={isCreating ? <CircularProgress size={16} /> : null}
        >
          {isCreating ? '作成中...' : 'サンプルデータを作成'}
        </Button>
      }
    >
      <Box>
        <Typography variant="body2" gutterBottom>
          現場とカテゴリーのデータが見つかりません。
        </Typography>
        <Typography variant="body2">
          サンプルデータを作成すると、支出入力をすぐに試すことができます。
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Alert>
  );
};

export default DataInitializer;
