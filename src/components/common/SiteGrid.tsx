import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Site } from '../../types';
import ImageDisplay from './ImageDisplay';
import DocumentDisplay from './DocumentDisplay';

interface SiteGridProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSiteSelect: (siteId: string) => void;
  onImageClick?: (src: string, alt: string) => void;
  getBudgetBySite: (siteId: string) => number;
  getCategoriesBySite: (siteId: string) => any[];
  getExpensesBySite: (siteId: string) => any[];
}

const SiteGrid: React.FC<SiteGridProps> = ({
  sites,
  selectedSiteId,
  onSiteSelect,
  onImageClick,
  getBudgetBySite,
  getCategoriesBySite,
  getExpensesBySite
}) => {
  return (
    <Grid container spacing={2}>
      {sites.map((site) => {
        const budget = getBudgetBySite(site.id);
        const categories = getCategoriesBySite(site.id);
        const siteExpenseAmount = getExpensesBySite(site.id).reduce((sum, expense) => sum + expense.amount, 0);
        const isSelected = selectedSiteId === site.id;
        const budgetRemaining = budget - siteExpenseAmount;
        
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
              onClick={() => onSiteSelect(site.id)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom noWrap>
                  {site.name}
                </Typography>
                {site.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {site.description}
                  </Typography>
                )}
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Box>
                    <Typography variant="body2">
                      予算: ¥{budget.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: budgetRemaining >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      残金: {budgetRemaining >= 0 ? "+" : ""}¥{budgetRemaining.toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip 
                    label={isSelected ? '選択中' : '選択'} 
                    color={isSelected ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  カテゴリー: {categories.length} | 支出: ¥{siteExpenseAmount.toLocaleString()}
                </Typography>
                
                {/* 写真表示セクション */}
                {((site.imageIds && site.imageIds.length > 0) || 
                  (site.imageUrls && site.imageUrls.length > 0)) && (
                  <Box mt={1}>
                    <ImageDisplay
                      imageIds={site.imageIds}
                      imageUrls={site.imageUrls}
                      entityId={site.id}
                      maxDisplay={3}
                      size={32}
                      onImageClick={(src, alt) => {
                        // カード選択の防止
                        if (onImageClick) {
                          onImageClick(src, alt);
                        }
                      }}
                      showCounter={false}
                    />
                  </Box>
                )}

                {/* 書類表示セクション */}
                {((site.documentIds && site.documentIds.length > 0) || 
                  (site.documentUrls && site.documentUrls.length > 0)) && (
                  <Box mt={1}>
                    <DocumentDisplay
                      documentIds={site.documentIds}
                      documentUrls={site.documentUrls}
                      entityId={site.id}
                      maxDisplay={0}
                      showCounter={true}
                      compact={true}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SiteGrid;
