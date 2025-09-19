import React from 'react';
import { Box, Typography } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import { getImageFromLocalStorage } from '../../utils/imageUtils';

interface ImageDisplayProps {
  imageIds?: string[];
  imageUrls?: string[];
  entityId: string;
  maxDisplay?: number;
  size?: number;
  onImageClick?: (src: string, alt: string) => void;
  onShowAll?: () => void;
  showCounter?: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageIds = [],
  imageUrls = [],
  entityId,
  maxDisplay = 3,
  size = 24,
  onImageClick,
  onShowAll,
  showCounter = true
}) => {
  const totalImages = imageIds.length + imageUrls.length;
  
  if (totalImages === 0) {
    return null;
  }

  // 表示する画像を収集
  const displayImages: Array<{ src: string; alt: string; key: string }> = [];
  
  // ローカルストレージの画像を追加
  imageIds.forEach((imageId, index) => {
    if (displayImages.length < maxDisplay) {
      const imageData = getImageFromLocalStorage(entityId, imageId);
      if (imageData) {
        displayImages.push({
          src: imageData,
          alt: `画像-${index + 1}`,
          key: `local-${index}`
        });
      }
    }
  });
  
  // Firebase Storageの画像を追加（残り枠まで）
  if (displayImages.length < maxDisplay) {
    imageUrls.slice(0, maxDisplay - displayImages.length).forEach((url, index) => {
      displayImages.push({
        src: url,
        alt: `画像-${index + 1}`,
        key: `firebase-${index}`
      });
    });
  }

  return (
    <Box>
      {showCounter && (
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <ImageIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            写真 ({totalImages}枚)
          </Typography>
        </Box>
      )}
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {displayImages.map((image) => (
          <img
            key={image.key}
            src={image.src}
            alt={image.alt}
            style={{
              width: size,
              height: size,
              objectFit: 'cover',
              borderRadius: size > 32 ? 8 : 3,
              border: '1px solid #ddd',
              cursor: onImageClick ? 'pointer' : 'default'
            }}
            onClick={() => onImageClick?.(image.src, image.alt)}
          />
        ))}
        
        {/* 追加画像がある場合の表示 */}
        {totalImages > maxDisplay && (
          <Box
            sx={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.200',
              borderRadius: size > 32 ? 2 : 1,
              border: '1px solid #ddd',
              cursor: onShowAll ? 'pointer' : 'default',
              '&:hover': onShowAll ? {
                backgroundColor: 'grey.300'
              } : {}
            }}
            onClick={onShowAll}
          >
            <Typography 
              variant="caption" 
              color="text.secondary" 
              fontSize={size > 32 ? "12px" : "8px"}
            >
              +{totalImages - maxDisplay}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageDisplay;
