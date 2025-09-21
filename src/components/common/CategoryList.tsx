import React from 'react';
import { Box, Typography, Chip, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Book, Add, Delete } from '@mui/icons-material';
import { SiteCategory, SiteDiary } from '../../types';
import { calculateTotalCategoryExpenses } from '../../utils/transactionCalculations';
import { SiteExpense } from '../../types';
import ImageDisplay from './ImageDisplay';
import DocumentDisplay from './DocumentDisplay';

interface CategoryListProps {
  categories: SiteCategory[];
  siteExpenses: SiteExpense[];
  selectedSiteId?: string;
  siteDiaries?: SiteDiary[];
  onImageClick?: (src: string, alt: string) => void;
  onShowAllItems?: (type: 'photos' | 'documents', categoryName: string, category: SiteCategory) => void;
  onDiaryCreate?: (siteId: string, categoryId: string) => void;
  onDiaryClick?: (diary: SiteDiary) => void;
  onDiaryDelete?: (diary: SiteDiary) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  siteExpenses,
  selectedSiteId,
  siteDiaries = [],
  onImageClick,
  onShowAllItems,
  onDiaryCreate,
  onDiaryClick,
  onDiaryDelete
}) => {
  if (categories.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        カテゴリーが登録されていません
      </Typography>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={0}>
      {categories.map((category) => {
        const categoryExpenses = calculateTotalCategoryExpenses(siteExpenses, category.id, selectedSiteId);
        const budgetRemaining = category.budgetAmount - categoryExpenses;
        
        // このカテゴリーの日記帳を取得
        const categoryDiaries = siteDiaries.filter(diary => 
          diary.categoryId === category.id && 
          (!selectedSiteId || diary.siteId === selectedSiteId)
        );
        
        return (
          <Box 
            key={category.id} 
            display="flex" 
            flexDirection="column"
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 1,
              padding: 2,
              marginBottom: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }}
          >
            {/* カテゴリー基本情報 */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {category.name}
                </Typography>
                {category.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {category.description}
                  </Typography>
                )}
                <Typography variant="caption" display="block" color="error.main">
                  実績支出: ¥{categoryExpenses.toLocaleString()}
                </Typography>

                {/* カテゴリー写真表示 */}
                {((category.imageIds && category.imageIds.length > 0) || 
                  (category.imageUrls && category.imageUrls.length > 0)) && (
                  <Box mt={0.5}>
                    <ImageDisplay
                      imageIds={category.imageIds}
                      imageUrls={category.imageUrls}
                      entityId={category.id}
                      maxDisplay={3}
                      size={24}
                      onImageClick={onImageClick}
                      onShowAll={() => onShowAllItems?.('photos', category.name, category)}
                    />
                  </Box>
                )}

                {/* カテゴリー書類表示 */}
                {((category.documentIds && category.documentIds.length > 0) || 
                  (category.documentUrls && category.documentUrls.length > 0)) && (
                  <Box mt={0.5}>
                    <DocumentDisplay
                      documentIds={category.documentIds}
                      documentUrls={category.documentUrls}
                      entityId={category.id}
                      maxDisplay={3}
                      onShowAll={() => onShowAllItems?.('documents', category.name, category)}
                    />
                  </Box>
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip 
                  label={`¥${category.budgetAmount.toLocaleString()}`}
                  size="small"
                  color={category.isActive ? 'primary' : 'default'}
                />
                <Box sx={{ 
                  minWidth: '100px',
                  textAlign: 'right'
                }}>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    display: 'block'
                  }}>
                    予算残
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: budgetRemaining >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}>
                    {budgetRemaining >= 0 ? "+" : ""}¥{budgetRemaining.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 日記帳セクション */}
            <Box mt={2} pt={2} sx={{ borderTop: '1px solid #e0e0e0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  日記帳 ({categoryDiaries.length}件)
                </Typography>
                {onDiaryCreate && selectedSiteId && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => onDiaryCreate(selectedSiteId, category.id)}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                  >
                    日記作成
                  </Button>
                )}
              </Box>
              
              {/* 日記一覧 */}
              {categoryDiaries.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {categoryDiaries.slice(0, 3).map((diary) => (
                    <ListItem
                      key={diary.id}
                      sx={{
                        px: 1,
                        py: 0.5,
                        cursor: onDiaryClick ? 'pointer' : 'default',
                        '&:hover': onDiaryClick ? {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        } : {},
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onClick={() => onDiaryClick?.(diary)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            overflow: 'hidden'
                          }}>
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              minWidth: 'fit-content',
                              flexShrink: 0
                            }}>
                              {diary.recordDate}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {diary.title}
                            </Typography>
                          </Box>
                        }
                      />
                      {onDiaryDelete && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 親のonClickイベントを停止
                            onDiaryDelete(diary);
                          }}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.1)'
                            },
                            ml: 1,
                            flexShrink: 0
                          }}
                          title="日記帳を削除"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                  {categoryDiaries.length > 3 && (
                    <ListItem sx={{ px: 1, py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="caption" color="text.secondary" fontStyle="italic">
                            他 {categoryDiaries.length - 3} 件...
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  日記帳はまだありません
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default CategoryList;
