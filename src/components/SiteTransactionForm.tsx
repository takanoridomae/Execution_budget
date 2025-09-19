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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { Save, Clear, CalendarToday, PhotoCamera, Delete, Info, AttachFile, Image } from '@mui/icons-material';
import { useTransactions } from '../contexts/TransactionContext';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { TransactionType } from '../types';
import { formatFullDate, formatDateForStorage } from '../utils/dateUtils';
import { validateAmount, validateDescription } from '../utils/validationUtils';
import { useAlert } from '../hooks/useAlert';
import { useStorageMonitor } from '../hooks/useStorageMonitor';
import { saveImagesHybridBatch } from '../utils/imageUtils';
import { saveDocumentsHybridBatch } from '../utils/documentUtils';
import NumericInput from './common/NumericInput';
import DocumentAttachment, { DocumentInfo } from './common/DocumentAttachment';

// タブパネルコンポーネント（コンポーネント外で定義）
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SiteTransactionForm: React.FC = () => {
  const { addSiteTransaction, addSiteIncome, addSiteExpense, selectedDate, updateSiteIncome, updateSiteExpense } = useTransactions();
  const { activeSites, selectedSiteId, setSelectedSiteId } = useSites();
  const { getActiveCategoriesBySite } = useCategories();
  const { alert, showSuccess, showError } = useAlert();
  const { storageAlert, dismissAlert, checkAfterImageUpload } = useStorageMonitor();
  
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [siteId, setSiteId] = useState(selectedSiteId || '');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    siteId?: string;
    categoryId?: string;
    description?: string;
  }>({});
  
  // 画像アップロード関連の状態
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // 書類添付関連の状態
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);

  // タブ関連の状態
  const [currentTab, setCurrentTab] = useState(0);

  // 選択された現場のカテゴリーを取得
  const availableCategories = siteId ? getActiveCategoriesBySite(siteId) : [];

  // タブ変更ハンドラー
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };


  // タブのa11y props
  function a11yProps(index: number) {
    return {
      id: `transaction-tab-${index}`,
      'aria-controls': `transaction-tabpanel-${index}`,
    };
  }

  // タブごとのエラー数を取得
  const getTabErrors = () => {
    const basicErrors = ['amount', 'siteId', 'categoryId', 'description'].filter(key => fieldErrors[key as keyof typeof fieldErrors]);
    return {
      basic: basicErrors.length,
      photos: 0, // 写真にはバリデーションエラーなし
      documents: 0 // 書類にはバリデーションエラーなし
    };
  };

  const tabErrors = getTabErrors();
  
  // デバッグ情報（パフォーマンス向上のため一時的に無効化）
  // console.log('🔍 SiteTransactionForm Debug:', {
  //   activeSites: activeSites.length,
  //   selectedSiteId,
  //   siteId,
  //   availableCategories: availableCategories.length,
  //   categories: availableCategories
  // });
  
  // // カテゴリーデータの詳細確認
  // if (availableCategories.length > 0) {
  //   console.log('🔍 Category Details:', availableCategories.map(cat => ({
  //     id: cat.id,
  //     name: cat.name,
  //     budgetAmount: cat.budgetAmount,
  //     siteId: cat.siteId,
  //     isActive: cat.isActive
  //   })));
  // }

  // 現場変更時にカテゴリーをリセット
  useEffect(() => {
    setCategoryId('');
  }, [siteId]);

  // 選択された現場IDが変更されたら同期
  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== siteId) {
      setSiteId(selectedSiteId);
    }
  }, [selectedSiteId, siteId]);

  const clearForm = () => {
    setAmount('');
    setDescription('');
    setCategoryId('');
    setImageFiles([]);
    setImagePreviews([]);
    setDocumentFiles([]);
    setDocuments([]);
    // 現場は保持
    setFieldErrors({});
    setCurrentTab(0); // タブを基本情報に戻す
  };

  // 画像ファイル選択処理
  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const nextFiles = [...imageFiles, ...fileArray].slice(0, 5); // 最大5枚制限
    
    // プレビュー生成
    const previews = await Promise.all(
      nextFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    
    setImageFiles(nextFiles);
    setImagePreviews(previews);
  };

  // 画像削除処理
  const handleImageRemove = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // 書類添付ハンドラー
  const handleDocumentsChange = (docs: DocumentInfo[]) => {
    setDocuments(docs);
  };

  const handleDocumentFilesSelect = (files: File[]) => {
    setDocumentFiles(files);
  };

  const handleDocumentRemove = (document: DocumentInfo, index: number) => {
    // 新しく選択されたファイルの削除
    if (document.file) {
      setDocumentFiles(prev => prev.filter(f => f !== document.file));
    }
    
    // documents配列から削除
    const newDocuments = documents.filter((_, i) => i !== index);
    setDocuments(newDocuments);
  };

  // 画像保存処理
  const saveImagesToStorage = async (transactionId: string): Promise<{
    imageIds: string[];
    imageUrls: string[];
    saveReport: string;
  }> => {
    if (!imageFiles || imageFiles.length === 0) {
      return { imageIds: [], imageUrls: [], saveReport: '保存対象の画像がありません' };
    }

    console.log('🖼️ 画像保存開始:', {
      ファイル数: imageFiles.length,
      総サイズ: `${Math.round(imageFiles.reduce((sum, f) => sum + f.size, 0) / 1024)} KB`
    });

    try {
      const results = await saveImagesHybridBatch(transactionId, imageFiles);
      
      const imageIds = results.filter(r => r.imageId).map(r => r.imageId!);
      const imageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
      
      const saveReport = `画像保存完了: ${results.length}枚 (ローカル: ${results.filter(r => r.saveMethod === 'local').length}枚, Firebase: ${results.filter(r => r.saveMethod === 'firebase').length}枚)`;
      
      console.log('✅ 画像保存完了:', {
        保存数: results.length,
        ローカル: results.filter(r => r.saveMethod === 'local').length,
        Firebase: results.filter(r => r.saveMethod === 'firebase').length,
        imageIds,
        imageUrls
      });

      return { imageIds, imageUrls, saveReport };

    } catch (error) {
      console.error('❌ 画像保存エラー:', error);
      throw new Error(`画像の保存に失敗しました: ${error}`);
    }
  };

  // 書類保存処理
  const saveDocumentsToStorage = async (transactionId: string): Promise<{
    documentIds: string[];
    documentUrls: string[];
    saveReport: string;
  }> => {
    if (!documentFiles || documentFiles.length === 0) {
      return { documentIds: [], documentUrls: [], saveReport: '保存対象の書類がありません' };
    }

    console.log('📄 書類保存開始:', {
      ファイル数: documentFiles.length,
      総サイズ: `${Math.round(documentFiles.reduce((sum, f) => sum + f.size, 0) / 1024)} KB`
    });

    try {
      const results = await saveDocumentsHybridBatch(transactionId, documentFiles);
      
      const documentIds = results.filter(r => r.documentId).map(r => r.documentId!);
      const documentUrls = results.filter(r => r.documentUrl).map(r => r.documentUrl!);
      
      const saveReport = `書類保存完了: ${results.length}件 (ローカル: ${results.filter(r => r.saveMethod === 'local').length}件, Firebase: ${results.filter(r => r.saveMethod === 'firebase').length}件)`;
      
      console.log('✅ 書類保存完了:', {
        保存数: results.length,
        ローカル: results.filter(r => r.saveMethod === 'local').length,
        Firebase: results.filter(r => r.saveMethod === 'firebase').length,
        documentIds,
        documentUrls
      });

      return { documentIds, documentUrls, saveReport };

    } catch (error) {
      console.error('❌ 書類保存エラー:', error);
      throw new Error(`書類の保存に失敗しました: ${error}`);
    }
  };

  const validateFields = () => {
    const errors: typeof fieldErrors = {};

    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) errors.amount = amountValidation.errorMessage || '金額が無効です';

    if (!siteId) {
      errors.siteId = '現場を選択してください';
    }

    // 支出の場合のみカテゴリー必須
    if (transactionType === 'expense' && !categoryId) {
      errors.categoryId = 'カテゴリーを選択してください';
    }

    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.isValid) errors.description = descriptionValidation.errorMessage || '内容が無効です';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      showError('入力内容を確認してください');
      return;
    }

    if (!selectedDate) {
      showError('日付が選択されていません');
      return;
    }

    setLoading(true);
    try {
      let transactionId: string;
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];

      if (transactionType === 'income') {
        // 収入の場合：SiteIncomesコレクションに保存、カテゴリーは「売上」固定
        const incomeData = {
          amount: parseFloat(amount),
          content: description,
          date: formatDateForStorage(selectedDate),
          siteId,
        };
        
        transactionId = await addSiteIncome(incomeData);
        
        // 画像・書類がある場合は保存処理
        const hasFiles = (imageFiles && imageFiles.length > 0) || (documentFiles && documentFiles.length > 0);
        
        if (hasFiles) {
          console.log('🗂️ 収入にファイルを保存します:', {
            imageCount: imageFiles?.length || 0,
            documentCount: documentFiles?.length || 0
          });

          try {
            const updateData: any = {};
            let combinedSaveReport = '';
            
            // 画像保存
            if (imageFiles && imageFiles.length > 0) {
              const imageResult = await saveImagesToStorage(transactionId);
              newImageIds = imageResult.imageIds;
              newImageUrls = imageResult.imageUrls;

              if (newImageIds.length > 0) updateData.imageIds = newImageIds;
              if (newImageUrls.length > 0) updateData.imageUrls = newImageUrls;
              
              combinedSaveReport += imageResult.saveReport;
            }
            
            // 書類保存
            if (documentFiles && documentFiles.length > 0) {
              const documentResult = await saveDocumentsToStorage(transactionId);
              
              if (documentResult.documentIds.length > 0) updateData.documentIds = documentResult.documentIds;
              if (documentResult.documentUrls.length > 0) updateData.documentUrls = documentResult.documentUrls;
              
              if (combinedSaveReport) {
                combinedSaveReport += ' / ';
              }
              combinedSaveReport += documentResult.saveReport;
            }

            // ファイルデータが保存された場合、収入情報を更新
            if (Object.keys(updateData).length > 0) {
              await updateSiteIncome(transactionId, updateData);
            }

            showSuccess(`収入を追加しました（カテゴリー: 売上）${combinedSaveReport}`);
            
            // ファイルアップロード後にストレージ使用量をチェック
            checkAfterImageUpload();
          } catch (fileError) {
            console.error('ファイル保存エラー:', fileError);
            showError('収入は追加されましたが、ファイルの保存に失敗しました。');
          }
        } else {
          showSuccess('収入を追加しました（カテゴリー: 売上）');
        }
      } else {
        // 支出の場合：SiteExpensesコレクションに保存
        const expenseData = {
          amount: parseFloat(amount),
          content: description,
          date: formatDateForStorage(selectedDate),
          siteId,
          categoryId,
        };
        
        transactionId = await addSiteExpense(expenseData);
        
        // 画像・書類がある場合は保存処理
        const hasFiles = (imageFiles && imageFiles.length > 0) || (documentFiles && documentFiles.length > 0);
        
        if (hasFiles) {
          console.log('🗂️ 支出にファイルを保存します:', {
            imageCount: imageFiles?.length || 0,
            documentCount: documentFiles?.length || 0
          });

          try {
            const updateData: any = {};
            let combinedSaveReport = '';
            
            // 画像保存
            if (imageFiles && imageFiles.length > 0) {
              const imageResult = await saveImagesToStorage(transactionId);
              newImageIds = imageResult.imageIds;
              newImageUrls = imageResult.imageUrls;

              if (newImageIds.length > 0) updateData.imageIds = newImageIds;
              if (newImageUrls.length > 0) updateData.imageUrls = newImageUrls;
              
              combinedSaveReport += imageResult.saveReport;
            }
            
            // 書類保存
            if (documentFiles && documentFiles.length > 0) {
              const documentResult = await saveDocumentsToStorage(transactionId);
              
              if (documentResult.documentIds.length > 0) updateData.documentIds = documentResult.documentIds;
              if (documentResult.documentUrls.length > 0) updateData.documentUrls = documentResult.documentUrls;
              
              if (combinedSaveReport) {
                combinedSaveReport += ' / ';
              }
              combinedSaveReport += documentResult.saveReport;
            }

            // ファイルデータが保存された場合、支出情報を更新
            if (Object.keys(updateData).length > 0) {
              await updateSiteExpense(transactionId, updateData);
            }

            showSuccess(`支出を追加しました ${combinedSaveReport}`);
            
            // ファイルアップロード後にストレージ使用量をチェック
            checkAfterImageUpload();
          } catch (fileError) {
            console.error('ファイル保存エラー:', fileError);
            showError('支出は追加されましたが、ファイルの保存に失敗しました。');
          }
        } else {
          showSuccess('支出を追加しました');
        }
      }
      
      clearForm();
      
      // 現場選択を同期
      if (siteId !== selectedSiteId) {
        setSelectedSiteId(siteId);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      showError('取引の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {storageAlert.shouldShowAlert && (
        <Alert 
          severity={storageAlert.level} 
          onClose={dismissAlert}
          sx={{ mb: 2 }}
        >
          {storageAlert.message}
        </Alert>
      )}

      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <CalendarToday color="primary" />
        <Typography variant="h6" component="h2">
          現場取引の追加
        </Typography>
      </Box>

      {selectedDate && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {formatFullDate(selectedDate)}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="取引入力タブ"
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 'medium'
            }
          }}
        >
          <Tab 
            icon={<Info />} 
            label={
              <Badge badgeContent={tabErrors.basic} color="error" invisible={tabErrors.basic === 0}>
                基本情報
              </Badge>
            }
            {...a11yProps(0)}
          />
          <Tab 
            icon={<Image />} 
            label={
              <Badge badgeContent={imageFiles.length} color="primary" invisible={imageFiles.length === 0}>
                写真添付
              </Badge>
            }
            {...a11yProps(1)}
          />
          <Tab 
            icon={<AttachFile />} 
            label={
              <Badge badgeContent={documents.length} color="primary" invisible={documents.length === 0}>
                書類添付
              </Badge>
            }
            {...a11yProps(2)}
          />
        </Tabs>
      </Box>

      {/* タブパネル1: 基本情報 */}
      <TabPanel value={currentTab} index={0}>
        {/* 取引タイプ */}
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">取引タイプ</FormLabel>
          <RadioGroup
            row
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
          >
            <FormControlLabel value="income" control={<Radio />} label="収入" />
            <FormControlLabel value="expense" control={<Radio />} label="支出" />
          </RadioGroup>
        </FormControl>

        {/* 現場選択 */}
        <FormControl fullWidth sx={{ mb: 2 }} error={!!fieldErrors.siteId}>
          <InputLabel>現場</InputLabel>
          <Select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            label="現場"
          >
            {activeSites.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
          {fieldErrors.siteId && (
            <Typography variant="caption" color="error">
              {fieldErrors.siteId}
            </Typography>
          )}
        </FormControl>

        {/* カテゴリー選択 */}
        {transactionType === 'income' ? (
          // 収入時は「売上」固定表示
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel shrink>カテゴリー</InputLabel>
            <TextField
              value="売上"
              label="カテゴリー"
              disabled
              fullWidth
              variant="outlined"
              sx={{ 
                '& .MuiInputBase-input': { 
                  backgroundColor: '#f5f5f5',
                  color: 'text.primary'
                } 
              }}
              helperText="収入のカテゴリーは自動的に「売上」になります"
            />
          </FormControl>
        ) : (
          // 支出時は通常のカテゴリー選択
          <FormControl 
            fullWidth 
            sx={{ mb: 2 }} 
            error={!!fieldErrors.categoryId}
            disabled={!siteId}
          >
            <InputLabel id="category-select-label">カテゴリー</InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              value={categoryId}
              onChange={(e) => {
                // console.log('🔍 Category selected:', e.target.value);
                setCategoryId(e.target.value);
              }}
              label="カテゴリー"
              displayEmpty
              MenuProps={{
                disablePortal: false,
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    zIndex: 10000,
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
            >
              <MenuItem value="" disabled>
                <em>カテゴリーを選択してください</em>
              </MenuItem>
              {availableCategories.length > 0 ? (
                availableCategories.map((category) => {
                  // console.log('🔍 Rendering MenuItem:', {
                  //   id: category.id,
                  //   name: category.name,
                  //   budgetAmount: category.budgetAmount
                  // });
                  return (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name} (¥{Number(category.budgetAmount || 0).toLocaleString()})
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem value="" disabled>
                  カテゴリーが見つかりません
                </MenuItem>
              )}
            </Select>
            {fieldErrors.categoryId && (
              <Typography variant="caption" color="error">
                {fieldErrors.categoryId}
              </Typography>
            )}
            {siteId && availableCategories.length === 0 && (
              <Typography variant="caption" color="warning.main">
                この現場にはカテゴリーが登録されていません
              </Typography>
            )}
          </FormControl>
        )}

        {/* 金額 */}
        <NumericInput
          label="金額"
          value={amount}
          onChange={setAmount}
          error={!!fieldErrors.amount}
          helperText={fieldErrors.amount}
          fullWidth
          sx={{ mb: 2 }}
          required
        />

        {/* 内容 */}
        <TextField
          label="内容"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={!!fieldErrors.description}
          helperText={fieldErrors.description}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
          required
          placeholder="取引の詳細を入力..."
        />
      </TabPanel>

      {/* タブパネル2: 写真添付 */}
      <TabPanel value={currentTab} index={1}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCamera color="primary" />
          写真添付
        </Typography>
        
        {/* 画像プレビュー */}
        {imagePreviews.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              選択された画像 ({imagePreviews.length}/5枚)
            </Typography>
            <Box 
              display="grid" 
              gridTemplateColumns={{
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)'
              }}
              gap={2}
            >
              {imagePreviews.map((src, index) => (
                <Box key={index} position="relative">
                  <img
                    src={src}
                    alt={`upload-${index}`}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #ddd'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleImageRemove(index)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'error.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'error.dark' },
                      boxShadow: 2
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ファイル選択エリア */}
        <Box
          sx={{
            border: '2px dashed',
            borderColor: imageFiles.length >= 5 ? 'grey.300' : 'primary.main',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: imageFiles.length >= 5 ? 'grey.50' : 'primary.50',
            transition: 'all 0.2s ease',
            mb: 2
          }}
        >
          <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {imageFiles.length === 0 ? '写真をアップロード' : '追加の写真をアップロード'}
          </Typography>
          
          <Button
            variant="contained"
            component="label"
            startIcon={<PhotoCamera />}
            disabled={imageFiles.length >= 5}
            size="large"
            sx={{ mb: 2 }}
          >
            写真を選択
            <input
              type="file"
              accept="image/*" 
              multiple
              hidden
              onChange={(e) => handleImageSelect(e.target.files)}
            />
          </Button>
          
          {imageFiles.length >= 5 ? (
            <Typography variant="body2" color="error">
              画像は最大5枚まで選択できます
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">
              写真は自動的に圧縮されます。大きなファイルも安心してアップロードできます。
            </Typography>
          )}
        </Box>
      </TabPanel>

      {/* タブパネル3: 書類添付 */}
      <TabPanel value={currentTab} index={2}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFile color="primary" />
          書類添付
        </Typography>
        
        <DocumentAttachment
          entityId="site-transaction-form"
          documents={documents}
          onDocumentsChange={handleDocumentsChange}
          onFilesSelect={handleDocumentFilesSelect}
          onDocumentRemove={handleDocumentRemove}
          maxFiles={5}
          label="書類をアップロード（任意）"
          helperText="レシート、請求書、契約書などの書類をアップロードできます（最大10MB）"
        />
      </TabPanel>

      {/* タブナビゲーションとアクションボタン */}
      <Box 
        sx={{ 
          mt: 3,
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          position: 'sticky',
          bottom: 0,
          zIndex: 1
        }}
      >
        {/* タブナビゲーションボタン（モバイル向け） */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          sx={{ mb: 2, display: { xs: 'flex', sm: 'none' } }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentTab(Math.max(0, currentTab - 1))}
            disabled={currentTab === 0}
          >
            前へ
          </Button>
          <Typography variant="body2" color="textSecondary">
            {currentTab + 1} / 3
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentTab(Math.min(2, currentTab + 1))}
            disabled={currentTab === 2}
          >
            次へ
          </Button>
        </Box>

        {/* アクションボタン */}
        <Box 
          display="flex" 
          gap={2} 
          justifyContent="flex-end"
          flexDirection={{ xs: 'column', sm: 'row' }}
        >
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearForm}
            disabled={loading}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            クリア
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={loading || activeSites.length === 0}
            size="large"
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {loading ? '追加中...' : '追加'}
          </Button>
        </Box>
      </Box>

      {activeSites.length === 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          現場が登録されていません。まず現場を登録してください。
        </Alert>
      )}
    </Paper>
  );
};

export default SiteTransactionForm;
