import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Save, Clear, Edit, Close, PhotoCamera, Delete } from '@mui/icons-material';
import { useSites } from '../contexts/SiteContext';
import { useCategories } from '../contexts/CategoryContext';
import { SiteDiary, SiteCategory } from '../types';
import { formatDateForStorage } from '../utils/dateUtils';
import { validateDescription } from '../utils/validationUtils';
import { useAlert } from '../hooks/useAlert';
import DocumentAttachment, { DocumentInfo } from './common/DocumentAttachment';
import { saveDiaryImagesHybridBatch, getAllImagesForDiary, deleteImageFromFirebaseStorage, deleteImageFromLocalStorage } from '../utils/imageUtils';
import { saveDiaryDocumentsHybridBatch, getAllDocumentsForDiary, getDocumentIcon, deleteDocumentFromFirebaseStorage, deleteDocumentFromLocalStorage } from '../utils/documentUtils';
import { 
  addSiteDiaryToFirestore, 
  updateSiteDiaryInFirestore 
} from '../utils/siteDiaryFirebase';

interface SiteDiaryFormProps {
  open: boolean;
  onClose: () => void;
  editingDiary?: SiteDiary | null;
  presetSiteId?: string;
  presetCategoryId?: string;
  onSaved?: (diary: SiteDiary) => void;
}

interface FieldErrors {
  recordDate?: string;
  siteId?: string;
  categoryId?: string;
  title?: string;
  content?: string;
}

const SiteDiaryForm: React.FC<SiteDiaryFormProps> = ({
  open,
  onClose,
  editingDiary = null,
  presetSiteId = '',
  presetCategoryId = '',
  onSaved
}) => {
  // Hooks
  const { sites, activeSites } = useSites();
  const { getActiveCategoriesBySite } = useCategories();
  const { showAlert } = useAlert();

  // Form state
  const [recordDate, setRecordDate] = useState(() => {
    const today = new Date();
    return formatDateForStorage(today);
  });
  const [siteId, setSiteId] = useState(presetSiteId);
  const [categoryId, setCategoryId] = useState(presetCategoryId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ src: string; type: 'local' | 'firebase'; id?: string; url?: string }>>([]);
  const [hiddenImageIndices, setHiddenImageIndices] = useState<Set<number>>(new Set());
  const [existingDocuments, setExistingDocuments] = useState<Array<{ fileName: string; fileType: string; uploadedAt: string; source: 'local' | 'firebase'; data?: string; url?: string; id?: string }>>([]);
  const [hiddenDocumentIndices, setHiddenDocumentIndices] = useState<Set<number>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentInfo[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 選択した現場のカテゴリー一覧
  const siteCategories = siteId ? getActiveCategoriesBySite(siteId) : [];

  // 編集モードの初期化
  useEffect(() => {
    if (editingDiary) {
      setRecordDate(editingDiary.recordDate);
      setSiteId(editingDiary.siteId);
      setCategoryId(editingDiary.categoryId);
      setTitle(editingDiary.title);
      setContent(editingDiary.content);
      
      // 既存の画像データを読み込み
      console.log('📝 編集モード: 既存画像読み込み開始', editingDiary);
      const images = getAllImagesForDiary({
        id: editingDiary.id,
        imageIds: editingDiary.imageIds,
        imageUrls: editingDiary.imageUrls
      });
      setExistingImages(images);
      
      // 既存の書類データを読み込み
      console.log('📝 編集モード: 既存書類読み込み開始', editingDiary);
      const documents = getAllDocumentsForDiary({
        id: editingDiary.id,
        documentIds: editingDiary.documentIds,
        documentUrls: editingDiary.documentUrls
      });
      setExistingDocuments(documents);
      
      // 新規追加画像・書類はクリア
      setSelectedImages([]);
      setImagePreviews([]);
      setHiddenImageIndices(new Set()); // 編集開始時は非表示フラグをリセット
      setDocumentFiles([]);
      setSelectedDocuments([]);
      setHiddenDocumentIndices(new Set());
    } else {
      // 新規作成時の初期化
      setSiteId(presetSiteId);
      setCategoryId(presetCategoryId);
      setExistingImages([]);
      setHiddenImageIndices(new Set());
      setExistingDocuments([]);
      setHiddenDocumentIndices(new Set());
    }
  }, [editingDiary, presetSiteId, presetCategoryId]);

  // 現場変更時にカテゴリーをリセット
  useEffect(() => {
    if (siteId && !editingDiary) {
      // 新規作成時のみカテゴリーをリセット
      const newSiteCategories = getActiveCategoriesBySite(siteId);
      if (newSiteCategories.length > 0 && !newSiteCategories.find(cat => cat.id === categoryId)) {
        setCategoryId('');
      }
    }
  }, [siteId, getActiveCategoriesBySite, categoryId, editingDiary]);

  // 画像ファイル選択処理
  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const nextFiles = [...selectedImages, ...fileArray].slice(0, 10); // 最大10枚制限
    
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
    
    setSelectedImages(nextFiles);
    setImagePreviews(previews);
  };

  // 新規画像削除処理
  const handleImageRemove = (index: number) => {
    const newFiles = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setSelectedImages(newFiles);
    setImagePreviews(newPreviews);
  };

  // 既存画像削除処理（保存時に実際に削除される）
  const handleExistingImageRemove = (index: number) => {
    const targetImage = existingImages[index];
    const newHiddenIndices = new Set(hiddenImageIndices);
    newHiddenIndices.add(index);
    setHiddenImageIndices(newHiddenIndices);
    console.log('🗑️ 既存画像削除予約', { 
      削除インデックス: index, 
      削除対象画像: targetImage,
      削除対象URL: targetImage?.url,
      削除対象ID: targetImage?.id,
      総削除数: newHiddenIndices.size,
      元画像数: existingImages.length,
      現在の非表示インデックス: Array.from(newHiddenIndices)
    });
  };

  // 既存書類削除処理（保存時に実際に削除される）
  const handleExistingDocumentRemove = (index: number) => {
    const newHiddenIndices = new Set(hiddenDocumentIndices);
    newHiddenIndices.add(index);
    setHiddenDocumentIndices(newHiddenIndices);
    console.log('🗑️ 既存書類削除予約', { 
      削除インデックス: index, 
      総削除数: newHiddenIndices.size,
      元書類数: existingDocuments.length 
    });
  };

  // フォームリセット
  const resetForm = () => {
    const today = new Date();
    setRecordDate(formatDateForStorage(today));
    setSiteId(presetSiteId);
    setCategoryId(presetCategoryId);
    setTitle('');
    setContent('');
    setSelectedImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setHiddenImageIndices(new Set());
    setExistingDocuments([]);
    setHiddenDocumentIndices(new Set());
    setSelectedDocuments([]);
    setDocumentFiles([]);
    setFieldErrors({});
  };

  // バリデーション
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // 記載日のバリデーション
    if (!recordDate) {
      errors.recordDate = '記載日は必須です';
    }

    // 現場のバリデーション
    if (!siteId) {
      errors.siteId = '現場を選択してください';
    }

    // カテゴリーのバリデーション
    if (!categoryId) {
      errors.categoryId = 'カテゴリーを選択してください';
    }

    // 表題のバリデーション
    if (!title.trim()) {
      errors.title = '表題は必須です';
    } else if (title.trim().length > 100) {
      errors.title = '表題は100文字以内で入力してください';
    }

    // 日記明細のバリデーション
    const contentValidation = validateDescription(content);
    if (!contentValidation.isValid) {
      errors.content = contentValidation.errorMessage || '日記明細が無効です';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 画像保存処理
  const saveImagesToStorage = async (diaryId: string): Promise<{imageIds: string[], imageUrls: string[]}> => {
    if (selectedImages.length === 0) {
      return { imageIds: [], imageUrls: [] };
    }

    console.log('🖼️ 日記帳画像保存開始', { count: selectedImages.length });
    const result = await saveDiaryImagesHybridBatch(diaryId, selectedImages);
    console.log('✅ 日記帳画像保存完了', result);
    
    // 結果からIDとURLを分離
    const imageIds: string[] = [];
    const imageUrls: string[] = [];
    
    result.forEach(item => {
      if (item.imageId) imageIds.push(item.imageId);
      if (item.imageUrl) imageUrls.push(item.imageUrl);
    });
    
    return { imageIds, imageUrls };
  };

  // 書類保存処理
  const saveDocumentsToStorage = async (diaryId: string): Promise<{documentIds: string[], documentUrls: string[]}> => {
    if (documentFiles.length === 0) {
      return { documentIds: [], documentUrls: [] };
    }

      console.log('📄 日記帳書類保存開始', { count: documentFiles.length, diaryId });
      const result = await saveDiaryDocumentsHybridBatch(diaryId, documentFiles);
      console.log('✅ 日記帳書類保存完了', { 
        結果数: result.length,
        詳細: result
      });
    
    // 結果からIDとURLを分離
    const documentIds: string[] = [];
    const documentUrls: string[] = [];
    
    result.forEach(item => {
      if (item.documentId) documentIds.push(item.documentId);
      if (item.documentUrl) documentUrls.push(item.documentUrl);
    });
    
    return { documentIds, documentUrls };
  };

  // URLを正規化する関数
  const normalizeUrl = (url: string): string => {
    try {
      // URLをデコードして再エンコードすることで正規化
      return decodeURIComponent(url);
    } catch (error) {
      console.warn('URL正規化失敗:', url, error);
      return url;
    }
  };

  // 削除されたURLを収集する関数
  const getDeletedUrls = () => {
    const deletedImageUrls: string[] = [];
    const deletedImageIds: string[] = [];
    const deletedDocumentUrls: string[] = [];
    const deletedDocumentIds: string[] = [];

    // 削除された画像のURLとIDを収集
    existingImages.forEach((image, index) => {
      if (hiddenImageIndices.has(index)) {
        if (image.url) {
          const normalizedUrl = normalizeUrl(image.url);
          deletedImageUrls.push(normalizedUrl);
          console.log('🔍 削除対象画像URL詳細', {
            index: index,
            originalUrl: image.url,
            normalizedUrl: normalizedUrl,
            hidden: hiddenImageIndices.has(index)
          });
        }
        if (image.id) {
          deletedImageIds.push(image.id);
        }
      }
    });

    // 削除された書類のURLとIDを収集
    existingDocuments.forEach((document, index) => {
      if (hiddenDocumentIndices.has(index)) {
        if (document.url) {
          const normalizedUrl = normalizeUrl(document.url);
          deletedDocumentUrls.push(normalizedUrl);
          console.log('🔍 削除対象書類URL詳細', {
            index: index,
            originalUrl: document.url,
            normalizedUrl: normalizedUrl,
            hidden: hiddenDocumentIndices.has(index)
          });
        }
        if (document.id) {
          deletedDocumentIds.push(document.id);
        }
      }
    });

    console.log('🗑️ 削除対象URL収集結果', {
      削除画像URLs: deletedImageUrls,
      削除画像IDs: deletedImageIds,
      削除書類URLs: deletedDocumentUrls,
      削除書類IDs: deletedDocumentIds
    });

    // デバッグ用：元データの詳細表示
    console.log('📊 削除前の元データ詳細', {
      editingDiary_imageUrls: editingDiary?.imageUrls,
      editingDiary_imageIds: editingDiary?.imageIds,
      editingDiary_documentUrls: editingDiary?.documentUrls,
      editingDiary_documentIds: editingDiary?.documentIds,
      existingImages: existingImages.map((img, idx) => ({ index: idx, url: img.url, id: img.id, hidden: hiddenImageIndices.has(idx) })),
      existingDocuments: existingDocuments.map((doc, idx) => ({ index: idx, url: doc.url, id: doc.id, fileName: doc.fileName, hidden: hiddenDocumentIndices.has(idx) }))
    });

    return { deletedImageUrls, deletedImageIds, deletedDocumentUrls, deletedDocumentIds };
  };

  // 削除されたファイルをFirebase Storageから削除する関数
  const deleteRemovedFilesFromStorage = async () => {
    const { deletedImageUrls, deletedImageIds, deletedDocumentUrls, deletedDocumentIds } = getDeletedUrls();
    const deletionPromises: Promise<void>[] = [];

    // Firebase Storageから画像を削除
    deletedImageUrls.forEach(url => {
      console.log('🗑️ Firebase Storage画像削除予約:', url);
      deletionPromises.push(deleteImageFromFirebaseStorage(url));
    });

    // Firebase Storageから書類を削除
    deletedDocumentUrls.forEach(url => {
      console.log('🗑️ Firebase Storage書類削除予約:', url);
      deletionPromises.push(deleteDocumentFromFirebaseStorage(url));
    });

    // ローカルストレージから画像を削除
    if (editingDiary) {
      deletedImageIds.forEach(id => {
        console.log('🗑️ ローカルストレージ画像削除予約:', id);
        try {
          deleteImageFromLocalStorage(editingDiary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ画像削除失敗:', error);
        }
      });

      // ローカルストレージから書類を削除
      deletedDocumentIds.forEach(id => {
        console.log('🗑️ ローカルストレージ書類削除予約:', id);
        try {
          deleteDocumentFromLocalStorage(editingDiary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ書類削除失敗:', error);
        }
      });
    }

    // 全ての削除処理を並行実行
    if (deletionPromises.length > 0) {
      console.log(`🗑️ Firebase Storage削除開始: ${deletionPromises.length}件`);
      await Promise.allSettled(deletionPromises);
      console.log('🗑️ Firebase Storage削除完了');
    }
  };

  // 指定された削除対象URLでファイル削除を実行する関数
  const deleteSpecificFilesFromStorage = async (targetUrls: { deletedImageUrls: string[], deletedImageIds: string[], deletedDocumentUrls: string[], deletedDocumentIds: string[] }) => {
    const { deletedImageUrls, deletedImageIds, deletedDocumentUrls, deletedDocumentIds } = targetUrls;
    const deletionPromises: Promise<void>[] = [];

    // Firebase Storageから画像を削除
    deletedImageUrls.forEach(url => {
      console.log('🗑️ Firebase Storage画像削除予約:', url);
      deletionPromises.push(deleteImageFromFirebaseStorage(url));
    });

    // Firebase Storageから書類を削除
    deletedDocumentUrls.forEach(url => {
      console.log('🗑️ Firebase Storage書類削除予約:', url);
      deletionPromises.push(deleteDocumentFromFirebaseStorage(url));
    });

    // ローカルストレージから画像を削除
    if (editingDiary) {
      deletedImageIds.forEach(id => {
        console.log('🗑️ ローカルストレージ画像削除予約:', id);
        try {
          deleteImageFromLocalStorage(editingDiary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ画像削除失敗:', error);
        }
      });

      // ローカルストレージから書類を削除
      deletedDocumentIds.forEach(id => {
        console.log('🗑️ ローカルストレージ書類削除予約:', id);
        try {
          deleteDocumentFromLocalStorage(editingDiary.id, id);
        } catch (error) {
          console.warn('⚠️ ローカルストレージ書類削除失敗:', error);
        }
      });
    }

    // 全ての削除処理を並行実行
    if (deletionPromises.length > 0) {
      console.log(`🗑️ Firebase Storage削除開始: ${deletionPromises.length}件`);
      await Promise.allSettled(deletionPromises);
      console.log('🗑️ Firebase Storage削除完了');
    }
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert('error', '入力内容を確認してください');
      return;
    }

    setIsSubmitting(true);

    try {
      let diaryId: string;
      
      // 基本情報の保存
      const diaryData = {
        recordDate,
        siteId,
        categoryId,
        title: title.trim(),
        content: content.trim(),
        createdAt: editingDiary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingDiary) {
        // 更新の場合
        diaryId = editingDiary.id;
        await updateSiteDiaryInFirestore(diaryId, diaryData);
      } else {
        // 新規作成の場合
        diaryId = await addSiteDiaryToFirestore(diaryData);
      }

      // 画像とドキュメントの保存
      let imageIds: string[] = [];
      let imageUrls: string[] = [];
      let documentIds: string[] = [];
      let documentUrls: string[] = [];

      if (selectedImages.length > 0) {
        const imageResult = await saveImagesToStorage(diaryId);
        imageIds = imageResult.imageIds;
        imageUrls = imageResult.imageUrls;
      }

      if (documentFiles.length > 0) {
        const documentResult = await saveDocumentsToStorage(diaryId);
        documentIds = documentResult.documentIds;
        documentUrls = documentResult.documentUrls;
      }

      // 既存画像と新規画像を統合
      const finalImageIds: string[] = [];
      const finalImageUrls: string[] = [];
      
      // 既存画像と書類を保持（編集時はオリジナルのデータを維持）
      const finalDocumentIds: string[] = [];
      const finalDocumentUrls: string[] = [];
      
      // 編集時の削除処理：削除対象URLを事前に取得してから処理
      let deletedUrls: { deletedImageUrls: string[], deletedImageIds: string[], deletedDocumentUrls: string[], deletedDocumentIds: string[] } | null = null;
      
      if (editingDiary) {
        // 削除対象のURLを取得（Firestore更新前に保持）
        deletedUrls = getDeletedUrls();
        const { deletedImageUrls, deletedImageIds, deletedDocumentUrls, deletedDocumentIds } = deletedUrls;
        
        // 元のFirestoreデータから削除対象を除外して保持
        if (editingDiary.imageIds) {
          const filteredImageIds = editingDiary.imageIds.filter(id => !deletedImageIds.includes(id));
          finalImageIds.push(...filteredImageIds);
          console.log('🔍 画像IDフィルタリング結果', {
            元imageIds: editingDiary.imageIds,
            削除対象imageIds: deletedImageIds,
            残存imageIds: filteredImageIds
          });
        }
        if (editingDiary.imageUrls) {
          const filteredImageUrls = editingDiary.imageUrls.filter(url => {
            const normalizedUrl = normalizeUrl(url);
            const shouldKeep = !deletedImageUrls.includes(normalizedUrl);
            console.log('🔍 画像URL個別チェック', {
              originalUrl: url,
              normalizedUrl: normalizedUrl,
              削除対象か: deletedImageUrls.includes(normalizedUrl),
              保持するか: shouldKeep
            });
            return shouldKeep;
          });
          finalImageUrls.push(...filteredImageUrls);
          console.log('🔍 画像URLフィルタリング結果', {
            元imageUrls: editingDiary.imageUrls,
            元imageUrls正規化版: editingDiary.imageUrls.map(url => normalizeUrl(url)),
            削除対象imageUrls: deletedImageUrls,
            残存imageUrls: filteredImageUrls
          });
        }
        if (editingDiary.documentIds) {
          const filteredDocumentIds = editingDiary.documentIds.filter(id => !deletedDocumentIds.includes(id));
          finalDocumentIds.push(...filteredDocumentIds);
          console.log('🔍 書類IDフィルタリング結果', {
            元documentIds: editingDiary.documentIds,
            削除対象documentIds: deletedDocumentIds,
            残存documentIds: filteredDocumentIds
          });
        }
        if (editingDiary.documentUrls) {
          const filteredDocumentUrls = editingDiary.documentUrls.filter(url => {
            const normalizedUrl = normalizeUrl(url);
            const shouldKeep = !deletedDocumentUrls.includes(normalizedUrl);
            console.log('🔍 書類URL個別チェック', {
              originalUrl: url,
              normalizedUrl: normalizedUrl,
              削除対象か: deletedDocumentUrls.includes(normalizedUrl),
              保持するか: shouldKeep
            });
            return shouldKeep;
          });
          finalDocumentUrls.push(...filteredDocumentUrls);
          console.log('🔍 書類URLフィルタリング結果', {
            元documentUrls: editingDiary.documentUrls,
            元documentUrls正規化版: editingDiary.documentUrls.map(url => normalizeUrl(url)),
            削除対象documentUrls: deletedDocumentUrls,
            残存documentUrls: filteredDocumentUrls
          });
        }
        
        console.log('🗑️ 削除処理結果', {
          元画像ID数: editingDiary.imageIds?.length || 0,
          元画像URL数: editingDiary.imageUrls?.length || 0,
          削除画像数: deletedImageIds.length + deletedImageUrls.length,
          残存画像ID数: finalImageIds.length,
          残存画像URL数: finalImageUrls.length,
          元書類ID数: editingDiary.documentIds?.length || 0,
          元書類URL数: editingDiary.documentUrls?.length || 0,
          削除書類数: deletedDocumentIds.length + deletedDocumentUrls.length,
          残存書類ID数: finalDocumentIds.length,
          残存書類URL数: finalDocumentUrls.length
        });
      }
      
      // 新規画像を追加
      finalImageIds.push(...imageIds);
      finalImageUrls.push(...imageUrls);
      
      // 新規書類を追加
      finalDocumentIds.push(...documentIds);
      finalDocumentUrls.push(...documentUrls);

      // 画像・書類のデータを更新（編集時は常に更新）
      // Firestoreに空配列を送信してフィールドをクリアする
      const attachmentData: Partial<SiteDiary> = {
        updatedAt: new Date().toISOString()
      };
      
      // 編集時は元データが存在する場合、空配列でもフィールドを設定する（削除のため）
      if (editingDiary) {
        // 元に画像データがあった場合は必ず更新（削除含む）
        if (editingDiary.imageIds !== undefined || finalImageIds.length > 0) {
          attachmentData.imageIds = finalImageIds;
        }
        if (editingDiary.imageUrls !== undefined || finalImageUrls.length > 0) {
          attachmentData.imageUrls = finalImageUrls;
        }
        if (editingDiary.documentIds !== undefined || finalDocumentIds.length > 0) {
          attachmentData.documentIds = finalDocumentIds;
        }
        if (editingDiary.documentUrls !== undefined || finalDocumentUrls.length > 0) {
          attachmentData.documentUrls = finalDocumentUrls;
        }
      } else {
        // 新規作成時は空でない場合のみ設定
        if (finalImageIds.length > 0) {
          attachmentData.imageIds = finalImageIds;
        }
        if (finalImageUrls.length > 0) {
          attachmentData.imageUrls = finalImageUrls;
        }
        if (finalDocumentIds.length > 0) {
          attachmentData.documentIds = finalDocumentIds;
        }
        if (finalDocumentUrls.length > 0) {
          attachmentData.documentUrls = finalDocumentUrls;
        }
      }
      
      console.log('🔧 attachmentData作成結果', {
        編集モード: !!editingDiary,
        finalImageUrls: finalImageUrls,
        finalDocumentUrls: finalDocumentUrls,
        attachmentData: attachmentData,
        空配列送信: {
          imageUrls送信: 'imageUrls' in attachmentData,
          documentUrls送信: 'documentUrls' in attachmentData
        }
      });
      
      // 編集時または添付ファイルがある場合は更新
      const originalImageCount = editingDiary ? (editingDiary.imageIds?.length || 0) + (editingDiary.imageUrls?.length || 0) : 0;
      if (editingDiary || imageIds.length > 0 || imageUrls.length > 0 || documentIds.length > 0 || documentUrls.length > 0 || 
          existingImages.length !== originalImageCount) {
        
        // 1. まずFirestore DBを更新（リンクを削除）
        console.log('📝 Firestore DB更新開始...', {
          diaryId: diaryId,
          attachmentData: attachmentData
        });
        
        await updateSiteDiaryInFirestore(diaryId, attachmentData);
        
        console.log('📝 Firestore DB更新完了', {
          最終画像ID数: finalImageIds.length,
          最終画像URL数: finalImageUrls.length,
          書類ID数: finalDocumentIds.length,
          書類URL数: finalDocumentUrls.length,
          実際送信データ: attachmentData,
          保存予定データ: {
            imageIds: finalImageIds,
            imageUrls: finalImageUrls,
            documentIds: finalDocumentIds,
            documentUrls: finalDocumentUrls
          }
        });

        // デバッグ用：更新後のFirestoreデータを確認
        try {
          const { getSiteDiaryFromFirestore } = await import('../utils/siteDiaryFirebase');
          const updatedDiary = await getSiteDiaryFromFirestore(diaryId);
          console.log('🔍 更新後のFirestoreデータ確認', {
            diaryId: diaryId,
            更新後の日記帳データ: updatedDiary,
            更新後のimageUrls: updatedDiary?.imageUrls,
            更新後のdocumentUrls: updatedDiary?.documentUrls,
            更新後のimageIds: updatedDiary?.imageIds,
            更新後のdocumentIds: updatedDiary?.documentIds
          });
        } catch (verifyError) {
          console.warn('⚠️ 更新後データ確認でエラー:', verifyError);
        }

        // 2. 次にFirebase Storageから実ファイルを削除
        if (editingDiary && deletedUrls) {
          console.log('🗑️ Firebase Storage削除開始...');
          try {
            await deleteSpecificFilesFromStorage(deletedUrls);
            console.log('✅ Firebase Storage削除完了');
          } catch (error) {
            console.warn('⚠️ Firebase Storage削除で一部エラーが発生しましたが、処理を続行します:', error);
            // Storage削除失敗は致命的ではないため、処理を続行
          }
        }
      }

      // 成功時の処理
      const savedDiary: SiteDiary = {
        id: diaryId,
        ...diaryData,
        createdAt: editingDiary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 空でない場合のみフィールドを設定
      if (finalImageIds.length > 0) {
        savedDiary.imageIds = finalImageIds;
      }
      if (finalImageUrls.length > 0) {
        savedDiary.imageUrls = finalImageUrls;
      }
      if (finalDocumentIds.length > 0) {
        savedDiary.documentIds = finalDocumentIds;
      }
      if (finalDocumentUrls.length > 0) {
        savedDiary.documentUrls = finalDocumentUrls;
      }

      showAlert(
        'success',
        editingDiary ? '日記帳を更新しました' : '日記帳を保存しました'
      );

      onSaved?.(savedDiary);
      resetForm();
      onClose();

    } catch (error) {
      console.error('❌ 日記帳保存エラー:', error);
      showAlert(
        'error',
        `日記帳の保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Edit />
          <Typography variant="h6">
            {editingDiary ? '日記帳を編集' : '新しい日記帳を作成'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          {/* 記載日 */}
          <TextField
            label="記載日"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!fieldErrors.recordDate}
            helperText={fieldErrors.recordDate}
          />

          {/* 現場選択 */}
          <FormControl fullWidth margin="normal" error={!!fieldErrors.siteId}>
            <InputLabel>現場</InputLabel>
            <Select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              label="現場"
            >
              <MenuItem value="">
                <em>現場を選択してください</em>
              </MenuItem>
              {activeSites.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.siteId && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {fieldErrors.siteId}
              </Typography>
            )}
          </FormControl>

          {/* カテゴリー選択 */}
          <FormControl fullWidth margin="normal" error={!!fieldErrors.categoryId}>
            <InputLabel>カテゴリー</InputLabel>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              label="カテゴリー"
              disabled={!siteId}
            >
              <MenuItem value="">
                <em>カテゴリーを選択してください</em>
              </MenuItem>
              {siteCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.categoryId && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {fieldErrors.categoryId}
              </Typography>
            )}
          </FormControl>

          {/* 表題 */}
          <TextField
            label="表題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="日記の表題を入力してください"
            error={!!fieldErrors.title}
            helperText={fieldErrors.title}
            inputProps={{ maxLength: 100 }}
          />

          {/* 日記明細 */}
          <TextField
            label="日記明細"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={6}
            placeholder="詳細な内容を入力してください"
            error={!!fieldErrors.content}
            helperText={fieldErrors.content}
          />

          <Divider sx={{ my: 3 }} />

          {/* 画像添付セクション */}
          <Box>
            <Typography variant="h6" gutterBottom>
              画像の添付 ({(existingImages.length - hiddenImageIndices.size) + selectedImages.length}/10)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              日記に関連する写真を添付できます（最大10枚、1枚あたり最大10MB）
            </Typography>
            
            {/* 画像選択ボタン */}
            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCamera />}
              sx={{ mb: 2 }}
              disabled={(existingImages.length - hiddenImageIndices.size) + selectedImages.length >= 10}
            >
              写真を選択
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files)}
              />
            </Button>

            {/* 既存画像の表示 */}
            {existingImages.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  既存の画像 ({existingImages.length - hiddenImageIndices.size}枚)
                </Typography>
                <Grid container spacing={2}>
                  {existingImages.map((image, index) => {
                    // 削除予約されている画像にはストライクスルー表示
                    const isMarkedForDeletion = hiddenImageIndices.has(index);
                    
                    return (
                      <Grid item xs={6} sm={4} md={3} key={`existing-${index}`} {...({} as any)}>
                        <Card sx={{ 
                          position: 'relative',
                          opacity: isMarkedForDeletion ? 0.5 : 1,
                          filter: isMarkedForDeletion ? 'grayscale(70%)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          <CardMedia
                            component="img"
                            height="120"
                            image={image.src}
                            alt={`既存画像 ${index + 1}`}
                            sx={{ 
                              objectFit: 'cover',
                              textDecoration: isMarkedForDeletion ? 'line-through' : 'none'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleExistingImageRemove(index)}
                            title={isMarkedForDeletion ? "削除予約済み（更新時に削除されます）" : "削除"}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: isMarkedForDeletion ? 
                                'rgba(255, 152, 0, 0.8)' : // 削除予約済み：オレンジ
                                'rgba(244, 67, 54, 0.8)',  // 削除待ち：赤
                              color: 'white',
                              '&:hover': {
                                backgroundColor: isMarkedForDeletion ? 
                                  'rgba(255, 152, 0, 0.9)' : 
                                  'rgba(244, 67, 54, 0.9)'
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          {/* 削除予約状態表示 */}
                          {isMarkedForDeletion && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(255, 152, 0, 0.9)',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                zIndex: 1
                              }}
                            >
                              削除予約
                            </Box>
                          )}
                          
                          {/* 画像タイプ表示 */}
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              backgroundColor: image.type === 'firebase' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(33, 150, 243, 0.8)',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.7rem',
                              opacity: isMarkedForDeletion ? 0.7 : 1
                            }}
                          >
                            {image.type === 'firebase' ? 'クラウド' : 'ローカル'}
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* 新規追加画像の表示 */}
            {selectedImages.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  新規追加画像 ({selectedImages.length}枚)
                </Typography>
                <Grid container spacing={2}>
                  {imagePreviews.map((preview, index) => (
                    <Grid item xs={6} sm={4} md={3} key={`new-${index}`} {...({} as any)}>
                      <Card sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={preview}
                          alt={`新規画像 ${index + 1}`}
                          sx={{ objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleImageRemove(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        {/* 新規画像タグ */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: 'rgba(255, 152, 0, 0.8)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}
                        >
                          新規
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {existingImages.length === 0 && selectedImages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                画像が選択されていません
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 書類添付セクション */}
          <Box>
            <Typography variant="h6" gutterBottom>
              書類の添付 ({(existingDocuments.length - hiddenDocumentIndices.size) + documentFiles.length}/10)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              日記に関連する書類を添付できます（PDF、Word、Excel等）
            </Typography>

            {/* 既存書類の表示 */}
            {existingDocuments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  既存の書類 ({existingDocuments.length - hiddenDocumentIndices.size}件)
                </Typography>
                <List>
                  {existingDocuments.map((document, index) => {
                    // 削除予約されている書類の表示状態
                    const isMarkedForDeletion = hiddenDocumentIndices.has(index);

                    return (
                      <ListItem
                        key={`existing-doc-${index}`}
                        component="div"
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          position: 'relative',
                          opacity: isMarkedForDeletion ? 0.5 : 1,
                          textDecoration: isMarkedForDeletion ? 'line-through' : 'none',
                          backgroundColor: isMarkedForDeletion ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: isMarkedForDeletion ? 'rgba(255, 152, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Typography fontSize="1.5rem">
                            {getDocumentIcon(document.fileName)}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span">
                                {document.fileName}
                              </Typography>
                              {isMarkedForDeletion && (
                                <Typography 
                                  component="span" 
                                  variant="caption" 
                                  sx={{ 
                                    backgroundColor: 'rgba(255, 152, 0, 0.8)',
                                    color: 'white',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  削除予約
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="caption" color="text.secondary">
                                {document.source === 'firebase' ? 'クラウド保存' : 'ローカル保存'}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                {new Date(document.uploadedAt).toLocaleDateString()}
                              </Typography>
                            </>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleExistingDocumentRemove(index)}
                          title={isMarkedForDeletion ? "削除予約済み（更新時に削除されます）" : "削除"}
                          sx={{
                            backgroundColor: isMarkedForDeletion ? 
                              'rgba(255, 152, 0, 0.8)' : // 削除予約済み：オレンジ
                              'rgba(244, 67, 54, 0.8)',  // 削除待ち：赤
                            color: 'white',
                            '&:hover': {
                              backgroundColor: isMarkedForDeletion ? 
                                'rgba(255, 152, 0, 0.9)' : 
                                'rgba(244, 67, 54, 0.9)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* 新規書類添付 */}
            <DocumentAttachment
              entityId="diary-new"
              documents={selectedDocuments}
              onDocumentsChange={setSelectedDocuments}
              onFilesSelect={setDocumentFiles}
              label="新しい書類を追加"
              helperText="新しく書類を追加できます"
              maxFiles={10 - (existingDocuments.length - hiddenDocumentIndices.size)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<Clear />}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Save />}
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : editingDiary ? '更新' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SiteDiaryForm;
