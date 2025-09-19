import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SiteCategory } from '../../types';
import { calculateTotalCategoryExpenses } from '../../utils/transactionCalculations';
import { SiteExpense } from '../../types';
import ImageDisplay from './ImageDisplay';
import DocumentDisplay from './DocumentDisplay';

interface CategoryListProps {
  categories: SiteCategory[];
  siteExpenses: SiteExpense[];
  selectedSiteId?: string;
  onImageClick?: (src: string, alt: string) => void;
  onShowAllItems?: (type: 'photos' | 'documents', categoryName: string, category: SiteCategory) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  siteExpenses,
  selectedSiteId,
  onImageClick,
  onShowAllItems
}) => {
  if (categories.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        カテゴリーが登録されていません
      </Typography>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {categories.map((category) => {
        const categoryExpenses = calculateTotalCategoryExpenses(siteExpenses, category.id, selectedSiteId);
        const budgetRemaining = category.budgetAmount - categoryExpenses;
        
        return (
          <Box key={category.id} display="flex" justifyContent="space-between" alignItems="flex-start">
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
        );
      })}
    </Box>
  );
};

export default CategoryList;
