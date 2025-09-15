import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Divider,
  FormControl
} from '@mui/material';
import { Save, Clear, CalendarToday } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { IncomeCategory, ExpenseCategory } from '../types';
import { formatFullDate, formatDateForStorage } from '../utils/dateUtils';
import { validateAmount, validateCategory, validateDescription } from '../utils/validationUtils';
import { useAlert } from '../hooks/useAlert';
import CategorySelect from './common/CategorySelect';
import NumericInput from './common/NumericInput';

// Firebase Storage関連は削除
import { saveImagesHybridBatch } from '../utils/imageUtils';
import { useStorageMonitor } from '../hooks/useStorageMonitor';

const TransactionForm: React.FC = () => {
  const { addTransaction, updateTransaction, selectedDate } = useTransactions();
  const { alert, showSuccess, showError } = useAlert();
  const { storageAlert, dismissAlert, checkAfterImageUpload } = useStorageMonitor();
  const [transactionType, setTransactionType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    category?: string;
    description?: string;
  }>({});
  // 追加: 画像アップロード関連
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // トランザクションタイプが変更されたらカテゴリーをリセット
  useEffect(() => {
    setCategory('');
  }, [transactionType]);

  // フォームをリセットする関数
  const resetForm = () => {
    setTransactionType('income');
    setAmount('');
    setCategory('');
    setDescription('');
    setImageFiles([]);
    setImagePreviews([]);
    setFieldErrors({});
  };

  // バリデーション関数
  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    
    // 金額のバリデーション
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.errorMessage;
    }
    
    // カテゴリーのバリデーション
    const categoryValidation = validateCategory(category);
    if (!categoryValidation.isValid) {
      errors.category = categoryValidation.errorMessage;
    }
    
    // 詳細のバリデーション
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.errorMessage;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ハイブリッド画像保存処理（Firebase優先→ローカル フォールバック、デバイス間同期対応）
  const saveImagesToStorage = async (transactionId: string): Promise<{
    imageIds: string[];
    imageUrls: string[];
    saveReport: string;
  }> => {
    if (!imageFiles || imageFiles.length === 0) {
      return { imageIds: [], imageUrls: [], saveReport: '保存対象の画像がありません' };
    }

    console.log('🚀 ハイブリッド画像保存開始（デバイス間同期優先）', {
      ファイル数: imageFiles.length,
      総サイズ: `${Math.round(imageFiles.reduce((sum, f) => sum + f.size, 0) / 1024)} KB`
    });

    try {
      const results = await saveImagesHybridBatch(transactionId, imageFiles);
      
      const imageIds = results.filter(r => r.imageId).map(r => r.imageId!);
      const imageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
      
      const localCount = results.filter(r => r.saveMethod === 'local').length;
      const firebaseCount = results.filter(r => r.saveMethod === 'firebase').length;
      
      let saveReport = `${results.length}枚保存完了`;
      if (localCount > 0 && firebaseCount > 0) {
        saveReport += ` (クラウド: ${firebaseCount}枚、ローカル: ${localCount}枚)`;
      } else if (firebaseCount > 0) {
        saveReport += ` (クラウド保存・デバイス間同期対応)`;
      } else if (localCount > 0) {
        saveReport += ` (ローカル保存・Firebase準備中)`;
      }
      
      console.log('✅ ハイブリッド保存完了', {
        成功数: results.length,
        ローカル: localCount,
        Firebase: firebaseCount,
        imageIds,
        imageUrls
      });

      return { imageIds, imageUrls, saveReport };
      
    } catch (error) {
      console.error('❌ 画像保存エラー:', error);
      throw new Error(`画像の保存に失敗しました: ${error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('入力内容に誤りがあります。確認してください。');
      return;
    }
    
    setLoading(true);
    setFieldErrors({});
    
    try {
      const dateToUse = selectedDate || new Date();
      const dateString = formatDateForStorage(dateToUse);
      
      // まず取引を保存してIDを取得
      const newTransaction: any = {
        type: transactionType as 'income' | 'expense',
        amount: Number(amount),
        category: category as IncomeCategory | ExpenseCategory,
        content: description,
        date: dateString,
      };
      
      const transactionId = await addTransaction(newTransaction);
      
      // 画像がある場合はハイブリッド保存（ローカル→Firebase フォールバック）
      if (imageFiles && imageFiles.length > 0) {
        try {
          const { imageIds, imageUrls, saveReport } = await saveImagesToStorage(transactionId);
          
          // 取引に画像情報を追加で更新
          const updateData: any = {};
          if (imageIds.length > 0) {
            updateData.imageIds = imageIds;
          }
          if (imageUrls.length > 0) {
            updateData.imageUrls = imageUrls;
          }
          
          if (Object.keys(updateData).length > 0) {
            await updateTransaction(transactionId, updateData);
          }
          
          showSuccess(`取引が正常に保存されました！${saveReport}`);
          
          // 画像アップロード後にストレージ使用量をチェック
          checkAfterImageUpload();
        } catch (imageError) {
          console.error('画像保存エラー:', imageError);
          showError('取引は保存されましたが、画像の保存に失敗しました。');
        }
      } else {
        showSuccess('取引が正常に保存されました！');
      }
      
      resetForm();
    } catch (err) {
      showError('取引の保存に失敗しました');
      console.error('Error saving transaction:', err);
    } finally {
      setLoading(false);
    }
  };


  // 追加: 画像ファイル選択処理
  const onImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    // シンプルに追加モードで上書きしない場合は現在の配列に追加
    const nextFiles = [...imageFiles, ...files].slice(0, 5); // 最大5枚の制限例
    setImageFiles(nextFiles);
    // プレビュー生成
    const previews = nextFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };


  return (
    <Paper elevation={2} sx={{ 
      p: { xs: 2, sm: 3 }, 
      position: 'relative', 
      zIndex: 1, // 親のzIndexに依存
      height: { xs: '100%', lg: 'auto' },
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 日時表示 */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <CalendarToday color="primary" />
        <Typography id="transaction-form-title" variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          日時: {formatFullDate(selectedDate)}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box component="form" onSubmit={handleSubmit} sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {alert && (
          <Alert severity={alert.type}>
            {alert.message}
          </Alert>
        )}
        
        {/* ストレージ使用量アラート */}
        {storageAlert.shouldShowAlert && (
          <Alert 
            severity={storageAlert.level}
            onClose={dismissAlert}
            sx={{ mb: 2 }}
          >
            {storageAlert.message}
          </Alert>
        )}
        
        {/* 取引タイプ選択 */}
        <FormControl component="fieldset">
          <FormLabel component="legend">取引タイプ</FormLabel>
          <RadioGroup
            row
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <FormControlLabel value="income" control={<Radio />} label="収入" />
            <FormControlLabel value="expense" control={<Radio />} label="支出" />
          </RadioGroup>
        </FormControl>

        {/* 金額入力 */}
        <NumericInput
          fullWidth
          label="金額"
          value={amount}
          onChange={setAmount}
          error={!!fieldErrors.amount}
          helperText={fieldErrors.amount}
          maxValue={10000000}
        />

        {/* カテゴリー選択 */}
        <Box>
          <CategorySelect
            value={category}
            onChange={(value) => setCategory(value as IncomeCategory | ExpenseCategory)}
            transactionType={transactionType as 'income' | 'expense'}
            error={!!fieldErrors.category}
            helperText={fieldErrors.category}
          />
          {/* デバッグ情報（後で削除） */}
          <Typography variant="caption" color="textSecondary">
            Debug: transactionType={transactionType}, category="{category}"
          </Typography>
        </Box>

        {/* 詳細入力 */}
        <TextField
          fullWidth
          label="詳細"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={!!fieldErrors.description}
          helperText={fieldErrors.description || `${description.length}/500文字`}
          sx={{ 
            '& .MuiInputBase-root': {
              zIndex: 1
            }
          }}
        />

        {/* 画像アップロードUI */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
            画像ファイル（任意）
          </Typography>
          <Box sx={{
            border: '2px dashed #ccc',
            borderRadius: 1,
            p: 2,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={onImagesSelected}
              style={{
                width: '100%',
                padding: '8px',
                cursor: 'pointer'
              }}
            />
          </Box>
          {imagePreviews.length > 0 && (
            <Box 
              display="flex" 
              gap={1} 
              mt={2} 
              sx={{ 
                overflowX: 'auto',
                pb: 1
              }}
            >
              {imagePreviews.map((src, idx) => (
                <Box
                  key={idx}
                  sx={{
                    minWidth: 80,
                    minHeight: 80,
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <img 
                    src={src} 
                    alt={`upload-${idx}`} 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      objectFit: 'cover' 
                    }} 
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ボタン */}
        <Box display="flex" gap={2} sx={{ mt: 'auto' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
            sx={{ 
              flex: 1,
              backgroundColor: transactionType === 'income' ? '#1976d2' : '#d32f2f',
              '&:hover': {
                backgroundColor: transactionType === 'income' ? '#1565c0' : '#c62828'
              },
              '&:disabled': {
                backgroundColor: transactionType === 'income' ? '#90caf9' : '#ef9a9a'
              }
            }}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            startIcon={<Clear />}
            onClick={resetForm}
            sx={{ flex: 1 }}
          >
            クリア
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TransactionForm;