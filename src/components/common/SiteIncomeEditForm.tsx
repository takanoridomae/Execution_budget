import React from 'react';
import {
  TextField,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { SiteIncome } from '../../types';
import { SiteIncomeEditForm } from '../../hooks/useSiteDataEdit';
import NumericInput from './NumericInput';

interface SiteIncomeEditFormProps {
  income: SiteIncome;
  editForm: SiteIncomeEditForm;
  onUpdateForm: (field: keyof SiteIncomeEditForm, value: string | File[] | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageSelect?: (files: FileList | null) => void;
  onImageRemove?: (index: number) => void;
  onExistingImageRemove?: (index: number, type: 'local' | 'firebase') => void;
}

const SiteIncomeEditFormComponent: React.FC<SiteIncomeEditFormProps> = ({
  income,
  editForm,
  onUpdateForm,
  onSave,
  onCancel,
  onImageSelect,
  onImageRemove,
  onExistingImageRemove
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 1行目: ボタンのみ */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => {
              console.log('💾 現場収入保存ボタンクリック');
              onSave();
            }}
          >
            <Save />
          </IconButton>
          <IconButton size="small" onClick={onCancel}>
            <Cancel />
          </IconButton>
        </Box>
        {/* 2行目: 金額 */}
        <Box>
          <NumericInput
            label="金額"
            value={editForm.amount}
            onChange={(value) => onUpdateForm('amount', value)}
            fullWidth
            size="small"
          />
        </Box>
        {/* 3行目: 詳細（全幅） */}
        <Box>
          <TextField
            label="詳細"
            value={editForm.content}
            onChange={(e) => onUpdateForm('content', e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
        </Box>
        
        {/* 4行目: 画像表示・編集 */}
        <Box sx={{ mt: 2 }}>
          {/* 既存画像表示 */}
          {(editForm.existingImageIds.length > 0 || editForm.existingImageUrls.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                既存の画像
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {editForm.existingImageIds.map((imageId, index) => (
                  <Box
                    key={`local-${imageId}`}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={`data:image/jpeg;base64,${imageId}`}
                      alt={`画像 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        minWidth: 20,
                        width: 20,
                        height: 20
                      }}
                      onClick={() => {
                        if (onExistingImageRemove) {
                          onExistingImageRemove(index, 'local');
                        } else {
                          const newImageIds = editForm.existingImageIds.filter((_, i) => i !== index);
                          onUpdateForm('existingImageIds', newImageIds);
                        }
                      }}
                    >
                      <Cancel sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
                {editForm.existingImageUrls.map((imageUrl, index) => (
                  <Box
                    key={`firebase-${imageUrl}`}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`画像 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        console.warn('画像読み込みエラー:', imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        minWidth: 20,
                        width: 20,
                        height: 20
                      }}
                      onClick={() => {
                        if (onExistingImageRemove) {
                          onExistingImageRemove(index, 'firebase');
                        } else {
                          const newImageUrls = editForm.existingImageUrls.filter((_, i) => i !== index);
                          onUpdateForm('existingImageUrls', newImageUrls);
                        }
                      }}
                    >
                      <Cancel sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {/* 新しい画像プレビュー */}
          {editForm.imagePreviews.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                新しい画像
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {editForm.imagePreviews.map((preview, index) => (
                  <Box
                    key={`preview-${index}`}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={preview}
                      alt={`新しい画像 ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        minWidth: 20,
                        width: 20,
                        height: 20
                      }}
                      onClick={() => {
                        if (onImageRemove) {
                          onImageRemove(index);
                        } else {
                          const newImageFiles = editForm.imageFiles.filter((_, i) => i !== index);
                          const newImagePreviews = editForm.imagePreviews.filter((_, i) => i !== index);
                          onUpdateForm('imageFiles', newImageFiles);
                          onUpdateForm('imagePreviews', newImagePreviews);
                        }
                      }}
                    >
                      <Cancel sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {/* 画像アップロードボタン */}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            id={`income-image-upload-${income.id}`}
            onChange={(e) => {
              if (onImageSelect) {
                onImageSelect(e.target.files);
              } else {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                const handleImageSelect = async () => {
                  const fileArray = Array.from(files);
                  const currentFiles = editForm.imageFiles || [];
                  const nextFiles = [...currentFiles, ...fileArray].slice(0, 5);
                  
                  const previews = await Promise.all(
                    nextFiles.map(file => {
                      return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(file);
                      });
                    })
                  );
                  
                  onUpdateForm('imageFiles', nextFiles);
                  onUpdateForm('imagePreviews', previews);
                };
                
                handleImageSelect();
              }
            }}
          />
          <label htmlFor={`income-image-upload-${income.id}`}>
            <IconButton component="span" size="small" sx={{ border: '1px dashed #ccc', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                📷
                <br />
                画像追加
              </Typography>
            </IconButton>
          </label>
        </Box>
      </Box>
    </Box>
  );
};

export default SiteIncomeEditFormComponent;
