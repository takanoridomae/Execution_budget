import React from 'react';
import {
  TextField,
  IconButton,
  Box,
  Typography,
  Button
} from '@mui/material';
import { Save, Cancel, Delete, PhotoCamera } from '@mui/icons-material';
import { getImageFromLocalStorage } from '../../utils/imageUtils';
import { Transaction } from '../../types';
import { EditForm } from '../../hooks/useTransactionEdit';
import CategorySelect from './CategorySelect';
import NumericInput from './NumericInput';

interface TransactionEditFormProps {
  transaction: Transaction;
  editForm: EditForm;
  onUpdateForm: (field: keyof EditForm, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageFilesChange: (files: File[]) => void;
  onRemoveNewImage: (index: number) => void;
  onRemoveExistingImage: (index: number) => void;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  editForm,
  onUpdateForm,
  onSave,
  onCancel,
  onImageFilesChange,
  onRemoveNewImage,
  onRemoveExistingImage
}) => {

  // 画像ファイル選択処理
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onImageFilesChange(files);
    }
  };




  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 1行目: 金額・カテゴリー・ボタン */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 2 }}>
            <NumericInput
              label="金額"
              value={editForm.amount}
              onChange={(value) => onUpdateForm('amount', value)}
              fullWidth
              size="small"
            />
          </Box>
          <Box sx={{ flex: 2 }}>
            <CategorySelect
              value={editForm.category}
              onChange={(value) => onUpdateForm('category', value)}
              transactionType={transaction.type}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => {
                console.log('💾 保存ボタンクリック');
                onSave();
              }}
            >
              <Save />
            </IconButton>
            <IconButton size="small" onClick={onCancel}>
              <Cancel />
            </IconButton>
          </Box>
        </Box>
        {/* 2行目: 詳細（全幅） */}
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
        
        {/* 3行目: 画像管理 */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>画像</Typography>
          
          {/* 既存画像表示・削除 */}
          {(editForm.existingImageIds.length > 0 || editForm.existingImageUrls.length > 0) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">既存の画像</Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                {/* ローカルストレージの画像 */}
                {editForm.existingImageIds.map((imageId, index) => {
                  const imageData = getImageFromLocalStorage(transaction.id, imageId);
                  if (!imageData) return null;
                  
                  return (
                    <Box key={`existing-local-${index}`} sx={{ position: 'relative' }}>
                      <img 
                        src={imageData} 
                        alt={`existing-local-${index}`} 
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} 
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveExistingImage(index)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'white',
                          '&:hover': { backgroundColor: '#ffebee' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
                
                {/* 後方互換性: Firebase Storageの画像 */}
                {editForm.existingImageUrls.map((url, index) => (
                  <Box key={`existing-url-${index}`} sx={{ position: 'relative' }}>
                    <img 
                      src={url} 
                      alt={`existing-url-${index}`} 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} 
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveExistingImage(editForm.existingImageIds.length + index)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        '&:hover': { backgroundColor: '#ffebee' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {/* 新規追加画像表示・削除 */}
          {editForm.imagePreviews.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">追加する画像</Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                {editForm.imagePreviews.map((src, index) => (
                  <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                    <img 
                      src={src} 
                      alt={`new-${index}`} 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} 
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveNewImage(index)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        '&:hover': { backgroundColor: '#ffebee' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {/* 画像追加ボタン */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PhotoCamera />}
            component="label"
            disabled={editForm.existingImageIds.length + editForm.existingImageUrls.length + editForm.imageFiles.length >= 5}
          >
            画像を追加
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageFileSelect}
            />
          </Button>
          {editForm.existingImageIds.length + editForm.existingImageUrls.length + editForm.imageFiles.length >= 5 && (
            <Typography variant="caption" color="error" sx={{ ml: 1 }}>
              画像は最大5枚まで
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionEditForm;
