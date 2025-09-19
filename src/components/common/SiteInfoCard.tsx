import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Site } from '../../types';
import ImageDisplay from './ImageDisplay';
import DocumentDisplay from './DocumentDisplay';

interface SiteInfoCardProps {
  site: Site;
  budget: number;
  categoriesCount: number;
  incomeAmount: number;
  expenseAmount: number;
  onImageClick?: (src: string, alt: string) => void;
}

const SiteInfoCard: React.FC<SiteInfoCardProps> = ({
  site,
  budget,
  categoriesCount,
  incomeAmount,
  expenseAmount,
  onImageClick
}) => {
  const budgetMinusExpense = budget - expenseAmount;
  const incomeMinusExpense = incomeAmount - expenseAmount;

  return (
    <Box>
      <Typography variant="h6" color="primary" gutterBottom>
        現場情報
      </Typography>
      {site.description && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {site.description}
        </Typography>
      )}
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>予算合計:</strong> ¥{budget.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>カテゴリー数:</strong> {categoriesCount}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>実績入金:</strong> ¥{incomeAmount.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>実績支出:</strong> ¥{expenseAmount.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: budgetMinusExpense >= 0 ? 'success.main' : 'error.main',
        fontWeight: 'bold',
        mb: 1
      }}>
        <strong>予算残高:</strong> {budgetMinusExpense >= 0 ? "+" : ""}¥{budgetMinusExpense.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ 
        color: incomeMinusExpense >= 0 ? 'success.main' : 'error.main',
        fontWeight: 'bold'
      }}>
        <strong>実績利益:</strong> {incomeMinusExpense >= 0 ? "+" : ""}¥{incomeMinusExpense.toLocaleString()}
      </Typography>

      {/* 写真表示セクション */}
      {((site.imageIds && site.imageIds.length > 0) || 
        (site.imageUrls && site.imageUrls.length > 0)) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="primary" gutterBottom>
            📷 現場写真
          </Typography>
          <ImageDisplay
            imageIds={site.imageIds}
            imageUrls={site.imageUrls}
            entityId={site.id}
            maxDisplay={4}
            size={60}
            onImageClick={onImageClick}
            showCounter={false}
          />
        </>
      )}

      {/* 書類表示セクション */}
      {((site.documentIds && site.documentIds.length > 0) || 
        (site.documentUrls && site.documentUrls.length > 0)) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="primary" gutterBottom>
            📄 現場書類
          </Typography>
          <DocumentDisplay
            documentIds={site.documentIds}
            documentUrls={site.documentUrls}
            entityId={site.id}
            maxDisplay={10}
            showCounter={false}
          />
        </>
      )}
      
      {site.comment && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            💬 {site.comment}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default SiteInfoCard;
