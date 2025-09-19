import { useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction, IncomeCategory, ExpenseCategory } from '../types';
import { useAlert } from './useAlert';
import { 
  saveImagesHybridBatch,
  getImageFromLocalStorage,
  deleteImageFromLocalStorage
} from '../utils/imageUtils';
import {
  saveDocumentsHybridBatch,
  getAllDocumentsForEntity,
  deleteDocumentFromLocalStorage,
  deleteDocumentFromFirebaseStorage
} from '../utils/documentUtils';
import { DocumentInfo } from '../components/common/DocumentAttachment';

export interface EditForm {
  amount: string;
  category: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  existingImageIds: string[]; // ローカルストレージ用の画像ID
  existingImageUrls: string[]; // 後方互換性のため残す
  documentFiles: File[];
  documents: DocumentInfo[];
  existingDocumentIds: string[]; // ローカルストレージ用の書類ID
  existingDocumentUrls: string[]; // Firebase Storage用の書類URL
}

export const useTransactionEdit = () => {
  const { updateTransaction, deleteTransaction } = useTransactions();
  const { alert, showSuccess, showError } = useAlert();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    amount: '',
    category: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    existingImageIds: [],
    existingImageUrls: [],
    documentFiles: [],
    documents: [],
    existingDocumentIds: [],
    existingDocumentUrls: []
  });

  // 編集開始
  const startEdit = (transaction: Transaction) => {
    console.log('📝 編集開始', {
      transactionId: transaction.id,
      hasImageIds: !!transaction.imageIds,
      imageIdsCount: transaction.imageIds?.length || 0,
      imageIds: transaction.imageIds,
      hasImageUrls: !!transaction.imageUrls,
      imageUrlsCount: transaction.imageUrls?.length || 0,
      imageUrls: transaction.imageUrls,
      hasDocumentIds: !!transaction.documentIds,
      documentIdsCount: transaction.documentIds?.length || 0,
      documentIds: transaction.documentIds,
      hasDocumentUrls: !!transaction.documentUrls,
      documentUrlsCount: transaction.documentUrls?.length || 0,
      documentUrls: transaction.documentUrls
    });
    
    setEditingTransaction(transaction);
    setEditForm({
      amount: transaction.amount.toString(),
      category: transaction.category,
      content: transaction.content || '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: transaction.imageIds || [],
      existingImageUrls: transaction.imageUrls || [], // 後方互換性
      documentFiles: [],
      documents: [],
      existingDocumentIds: transaction.documentIds || [],
      existingDocumentUrls: transaction.documentUrls || []
    });
    
    // ローカルストレージの画像存在確認
    if (transaction.imageIds) {
      transaction.imageIds.forEach((imageId, index) => {
        const imageData = getImageFromLocalStorage(transaction.id, imageId);
        console.log(`🖼️ 画像${index + 1} (${imageId}):`, imageData ? '存在' : '不在');
      });
    }

    // ローカルストレージの書類存在確認
    if (transaction.documentIds) {
      transaction.documentIds.forEach((documentId, index) => {
        const documentData = getAllDocumentsForEntity(transaction.id).find(d => d.id === documentId);
        console.log(`📄 書類${index + 1} (${documentId}):`, documentData ? '存在' : '不在');
      });
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingTransaction(null);
    setEditForm({ 
      amount: '', 
      category: '', 
      content: '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: [],
      existingImageUrls: [],
      documentFiles: [],
      documents: [],
      existingDocumentIds: [],
      existingDocumentUrls: []
    });
  };

  // フォーム更新
  const updateEditForm = (field: keyof EditForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 画像ファイル選択処理
  const handleImageFilesChange = (files: File[]) => {
    console.log('📁 画像ファイル選択', {
      newFiles: files.length,
      existingFiles: editForm.imageFiles.length,
      selectedFiles: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    const nextFiles = [...editForm.imageFiles, ...files].slice(0, 5); // 最大5枚制限
    const previews = nextFiles.map(file => URL.createObjectURL(file));
    
    console.log('📁 ファイル状態更新', {
      totalFiles: nextFiles.length,
      previews: previews.length
    });
    
    setEditForm(prev => ({
      ...prev,
      imageFiles: nextFiles,
      imagePreviews: previews
    }));
  };

  // 新規画像の削除
  const removeNewImage = (index: number) => {
    const newFiles = editForm.imageFiles.filter((_, i) => i !== index);
    const newPreviews = editForm.imagePreviews.filter((_, i) => i !== index);
    setEditForm(prev => ({
      ...prev,
      imageFiles: newFiles,
      imagePreviews: newPreviews
    }));
  };

  // 既存画像の削除
  const removeExistingImage = (index: number) => {
    console.log('🗑️ 画像削除処理開始', {
      index,
      totalImageIds: editForm.existingImageIds.length,
      totalImageUrls: editForm.existingImageUrls.length,
      imageIds: editForm.existingImageIds,
      imageUrls: editForm.existingImageUrls
    });
    
    // ローカルストレージの画像削除
    if (index < editForm.existingImageIds.length) {
      const imageIdToDelete = editForm.existingImageIds[index];
      if (editingTransaction) {
        console.log('🗑️ ローカルストレージから画像削除', { 
          transactionId: editingTransaction.id,
          imageId: imageIdToDelete,
          index 
        });
        deleteImageFromLocalStorage(editingTransaction.id, imageIdToDelete);
        
        // 削除後の確認
        const stillExists = getImageFromLocalStorage(editingTransaction.id, imageIdToDelete);
        console.log('🔍 削除確認', { imageId: imageIdToDelete, stillExists: !!stillExists });
      }
      
      const newIds = editForm.existingImageIds.filter((_, i) => i !== index);
      console.log('📝 更新後のImageIds', { before: editForm.existingImageIds, after: newIds });
      
      setEditForm(prev => ({
        ...prev,
        existingImageIds: newIds
      }));
    } else {
      // Firebase Storage画像の場合（後方互換性）
      const urlIndex = index - editForm.existingImageIds.length;
      console.log('🗑️ Firebase Storage画像削除', { urlIndex, url: editForm.existingImageUrls[urlIndex] });
      
      const newUrls = editForm.existingImageUrls.filter((_, i) => i !== urlIndex);
      setEditForm(prev => ({
        ...prev,
        existingImageUrls: newUrls
      }));
    }
  };

  // 書類添付ハンドラー
  const handleDocumentsChange = (docs: DocumentInfo[]) => {
    setEditForm(prev => ({
      ...prev,
      documents: docs
    }));
  };

  const handleDocumentFilesSelect = (files: File[]) => {
    setEditForm(prev => ({
      ...prev,
      documentFiles: files
    }));
  };

  const handleDocumentRemove = (document: DocumentInfo, index: number) => {
    // 新しく選択されたファイルの削除
    if (document.file) {
      setEditForm(prev => ({
        ...prev,
        documentFiles: prev.documentFiles.filter(f => f !== document.file)
      }));
    }
    
    // documents配列から削除
    setEditForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // 既存書類の削除
  const removeExistingDocument = (index: number) => {
    console.log('🗑️ 書類削除処理開始', {
      index,
      totalDocumentIds: editForm.existingDocumentIds.length,
      totalDocumentUrls: editForm.existingDocumentUrls.length,
      documentIds: editForm.existingDocumentIds,
      documentUrls: editForm.existingDocumentUrls
    });
    
    // ローカルストレージの書類削除
    if (index < editForm.existingDocumentIds.length) {
      const documentIdToDelete = editForm.existingDocumentIds[index];
      if (editingTransaction) {
        console.log('🗑️ ローカルストレージから書類削除', { 
          transactionId: editingTransaction.id,
          documentId: documentIdToDelete,
          index 
        });
        deleteDocumentFromLocalStorage(editingTransaction.id, documentIdToDelete);
      }
      
      const newIds = editForm.existingDocumentIds.filter((_, i) => i !== index);
      console.log('📝 更新後のDocumentIds', { before: editForm.existingDocumentIds, after: newIds });
      
      setEditForm(prev => ({
        ...prev,
        existingDocumentIds: newIds
      }));
    } else {
      // Firebase Storage書類の場合
      const urlIndex = index - editForm.existingDocumentIds.length;
      const documentUrl = editForm.existingDocumentUrls[urlIndex];
      console.log('🗑️ Firebase Storage書類削除', { urlIndex, url: documentUrl });
      
      // Firebase Storageから書類を削除
      if (documentUrl) {
        deleteDocumentFromFirebaseStorage(documentUrl).catch((error) => {
          console.warn('⚠️ Firebase書類削除失敗（続行）:', error);
        });
      }
      
      const newUrls = editForm.existingDocumentUrls.filter((_, i) => i !== urlIndex);
      setEditForm(prev => ({
        ...prev,
        existingDocumentUrls: newUrls
      }));
    }
  };

  // ハイブリッド画像保存（Firebase優先→ローカル フォールバック、デバイス間同期対応）
  const saveNewImages = async (): Promise<{
    imageIds: string[];
    imageUrls: string[];
    saveReport: string;
  }> => {
    if (!editingTransaction || editForm.imageFiles.length === 0) {
      console.log('📸 保存対象なし', {
        hasTransaction: !!editingTransaction,
        imageFilesCount: editForm.imageFiles.length
      });
      return { imageIds: [], imageUrls: [], saveReport: '保存対象なし' };
    }
    
    console.log('💾 編集画像ハイブリッド保存開始（デバイス間同期優先）', {
      transactionId: editingTransaction.id,
      fileCount: editForm.imageFiles.length,
      files: editForm.imageFiles.map(f => ({ name: f.name, size: f.size }))
    });
    
    try {
      const results = await saveImagesHybridBatch(editingTransaction.id, editForm.imageFiles);
      
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
      
      console.log('✅ 編集画像ハイブリッド保存完了', {
        成功数: results.length,
        ローカル: localCount,
        Firebase: firebaseCount,
        imageIds,
        imageUrls
      });
      
      return { imageIds, imageUrls, saveReport };
      
    } catch (error: any) {
      console.error('❌ 編集画像保存失敗:', error);
      throw new Error(`画像の保存に失敗しました: ${error.message}`);
    }
  };

  // ハイブリッド書類保存処理
  const saveNewDocuments = async (): Promise<{
    documentIds: string[];
    documentUrls: string[];
    saveReport: string;
  }> => {
    if (!editingTransaction || editForm.documentFiles.length === 0) {
      console.log('📄 保存対象なし', {
        hasTransaction: !!editingTransaction,
        documentFilesCount: editForm.documentFiles.length
      });
      return { documentIds: [], documentUrls: [], saveReport: '保存対象なし' };
    }
    
    console.log('💾 編集書類ハイブリッド保存開始', {
      transactionId: editingTransaction.id,
      fileCount: editForm.documentFiles.length,
      files: editForm.documentFiles.map(f => ({ name: f.name, size: f.size }))
    });
    
    try {
      const results = await saveDocumentsHybridBatch(editingTransaction.id, editForm.documentFiles);
      
      const documentIds = results.filter(r => r.documentId).map(r => r.documentId!);
      const documentUrls = results.filter(r => r.documentUrl).map(r => r.documentUrl!);
      
      const localCount = results.filter(r => r.saveMethod === 'local').length;
      const firebaseCount = results.filter(r => r.saveMethod === 'firebase').length;
      
      let saveReport = `${results.length}件保存完了`;
      if (localCount > 0 && firebaseCount > 0) {
        saveReport += ` (クラウド: ${firebaseCount}件、ローカル: ${localCount}件)`;
      } else if (firebaseCount > 0) {
        saveReport += ` (クラウド保存・デバイス間同期対応)`;
      } else if (localCount > 0) {
        saveReport += ` (ローカル保存・Firebase準備中)`;
      }
      
      console.log('✅ 編集書類ハイブリッド保存完了', {
        成功数: results.length,
        ローカル: localCount,
        Firebase: firebaseCount,
        documentIds,
        documentUrls
      });
      
      return { documentIds, documentUrls, saveReport };
      
    } catch (error: any) {
      console.error('❌ 編集書類保存失敗:', error);
      throw new Error(`書類の保存に失敗しました: ${error.message}`);
    }
  };

  // 編集保存処理
  const handleSave = async () => {
    if (!editingTransaction) {
      console.log('❌ 編集対象の取引がありません');
      return;
    }

    console.log('💾 編集保存開始', {
      transactionId: editingTransaction.id,
      editForm: editForm
    });

    // バリデーション
    if (!editForm.amount || isNaN(Number(editForm.amount)) || Number(editForm.amount) <= 0) {
      console.log('❌ 金額バリデーションエラー', editForm.amount);
      showError('正しい金額を入力してください');
      return;
    }

    if (!editForm.category) {
      console.log('❌ カテゴリーバリデーションエラー', editForm.category);
      showError('カテゴリーを選択してください');
      return;
    }

    try {
      console.log('🚀 編集保存開始', {
        transactionId: editingTransaction.id,
        imageFiles: editForm.imageFiles.length,
        existingImageIds: editForm.existingImageIds.length,
        existingImageUrls: editForm.existingImageUrls.length
      });

      // 新規ファイル（画像・書類）がある場合はハイブリッド保存
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];
      let newDocumentIds: string[] = [];
      let newDocumentUrls: string[] = [];
      let combinedSaveReport = '';
      
      // 画像保存
      if (editForm.imageFiles.length > 0) {
        console.log('💾 新規画像ハイブリッド保存開始（デバイス間同期優先）', { 
          fileCount: editForm.imageFiles.length,
          files: editForm.imageFiles.map(f => ({ name: f.name, size: f.size }))
        });
        
        try {
          const result = await saveNewImages();
          newImageIds = result.imageIds;
          newImageUrls = result.imageUrls;
          combinedSaveReport = result.saveReport;
          
          console.log('💾 新規画像ハイブリッド保存完了', { newImageIds, newImageUrls, saveReport: result.saveReport });
        } catch (saveError: any) {
          console.error('❌ 画像保存エラー', saveError);
          showError(`画像の保存に失敗しました: ${saveError.message}`);
          return; // 保存処理を中断
        }
      }
      
      // 書類保存
      if (editForm.documentFiles.length > 0) {
        console.log('💾 新規書類ハイブリッド保存開始', { 
          fileCount: editForm.documentFiles.length,
          files: editForm.documentFiles.map(f => ({ name: f.name, size: f.size }))
        });
        
        try {
          const result = await saveNewDocuments();
          newDocumentIds = result.documentIds;
          newDocumentUrls = result.documentUrls;
          
          if (combinedSaveReport) {
            combinedSaveReport += ' / ';
          }
          combinedSaveReport += result.saveReport;
          
          console.log('💾 新規書類ハイブリッド保存完了', { newDocumentIds, newDocumentUrls, saveReport: result.saveReport });
        } catch (saveError: any) {
          console.error('❌ 書類保存エラー', saveError);
          showError(`書類の保存に失敗しました: ${saveError.message}`);
          return; // 保存処理を中断
        }
      }
      
      // 既存画像IDと新規画像IDを結合
      const allImageIds = [...editForm.existingImageIds, ...newImageIds];
      // 既存画像URLと新規画像URLを結合
      const allImageUrls = [...editForm.existingImageUrls, ...newImageUrls];
      // 既存書類IDと新規書類IDを結合
      const allDocumentIds = [...editForm.existingDocumentIds, ...newDocumentIds];
      // 既存書類URLと新規書類URLを結合
      const allDocumentUrls = [...editForm.existingDocumentUrls, ...newDocumentUrls];
      
      console.log('🔗 ファイルID結合', { 
        existingImageIds: editForm.existingImageIds,
        newImageIds: newImageIds,
        allImageIds: allImageIds,
        existingImageUrls: allImageUrls,
        existingDocumentIds: editForm.existingDocumentIds,
        newDocumentIds: newDocumentIds,
        allDocumentIds: allDocumentIds,
        allDocumentUrls: allDocumentUrls
      });
      
      // 削除されたファイルをログで確認
      const originalImageIds = editingTransaction.imageIds || [];
      const deletedImageIds = originalImageIds.filter(id => !allImageIds.includes(id));
      if (deletedImageIds.length > 0) {
        console.log('🗑️ 削除された画像ID', deletedImageIds);
        // 削除された画像をローカルストレージからも確実に削除
        deletedImageIds.forEach(imageId => {
          deleteImageFromLocalStorage(editingTransaction.id, imageId);
        });
      }

      const originalDocumentIds = editingTransaction.documentIds || [];
      const originalDocumentUrls = editingTransaction.documentUrls || [];
      const deletedDocumentIds = originalDocumentIds.filter(id => !allDocumentIds.includes(id));
      const deletedDocumentUrls = originalDocumentUrls.filter(url => !allDocumentUrls.includes(url));
      
      if (deletedDocumentIds.length > 0) {
        console.log('🗑️ 削除された書類ID', deletedDocumentIds);
        // 削除された書類をローカルストレージからも確実に削除
        deletedDocumentIds.forEach(documentId => {
          deleteDocumentFromLocalStorage(editingTransaction.id, documentId);
        });
      }

      if (deletedDocumentUrls.length > 0) {
        console.log('🗑️ 削除された書類URL', deletedDocumentUrls);
        // Firebase Storageからも削除（既にremoveExistingDocument関数で削除済みだが、確認のため）
        deletedDocumentUrls.forEach(documentUrl => {
          console.log('🔄 Firebase書類削除確認:', documentUrl);
        });
      }

      console.log('📊 書類削除サマリー', {
        originalDocumentIds,
        originalDocumentUrls,
        finalDocumentIds: allDocumentIds,
        finalDocumentUrls: allDocumentUrls,
        deletedDocumentIds,
        deletedDocumentUrls
      });
      
      const updateData: any = {
        amount: Number(editForm.amount),
        category: editForm.category as IncomeCategory | ExpenseCategory,
        content: editForm.content
      };
      
      // 削除を反映するため、空の配列でも送信
      updateData.imageIds = allImageIds;
      updateData.imageUrls = allImageUrls;
      updateData.documentIds = allDocumentIds;
      updateData.documentUrls = allDocumentUrls;
      
      console.log('💾 更新データ', updateData);
      
      await updateTransaction(editingTransaction.id, updateData);
      console.log('✅ 取引更新完了');
      
      const successMessage = combinedSaveReport ? 
        `取引を更新しました！${combinedSaveReport}` : 
        '取引を更新しました！';
      showSuccess(successMessage);
      setEditingTransaction(null);
      setEditForm({ 
        amount: '', 
        category: '', 
        content: '',
        imageFiles: [],
        imagePreviews: [],
        existingImageIds: [],
        existingImageUrls: [],
        documentFiles: [],
        documents: [],
        existingDocumentIds: [],
        existingDocumentUrls: []
      });
    } catch (error: any) {
      console.error('❌ 編集保存エラー', error);
      
      // エラーの種類に応じてメッセージを変更
      if (error?.code === 'permission-denied') {
        showError('権限がありません。ログインし直してください。');
      } else if (error?.code === 'unavailable') {
        showError('ネットワークに接続できません。接続を確認してください。');
      } else {
        showError('更新に失敗しました。もう一度お試しください。');
      }
    }
  };

  // 削除処理
  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      showSuccess('取引を削除しました');
    } catch (error) {
      showError('削除に失敗しました');
    }
  };

  return {
    editingTransaction,
    editForm,
    alert,
    startEdit,
    cancelEdit,
    updateEditForm,
    handleSave,
    handleDelete,
    handleImageFilesChange,
    removeNewImage,
    removeExistingImage,
    handleDocumentsChange,
    handleDocumentFilesSelect,
    handleDocumentRemove,
    removeExistingDocument
  };
};
