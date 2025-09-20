import { useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { SiteIncome, SiteExpense } from '../types';
import { useAlert } from './useAlert';
import { saveImagesHybridBatch } from '../utils/imageUtils';
import { 
  saveDocumentsHybridBatch, 
  deleteDocumentFromLocalStorage, 
  deleteDocumentFromFirebaseStorage 
} from '../utils/documentUtils';

export interface SiteIncomeEditForm {
  amount: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  existingImageIds: string[];
  existingImageUrls: string[];
  documentFiles: File[];
  existingDocumentIds: string[];
  existingDocumentUrls: string[];
}

export interface SiteExpenseEditForm {
  amount: string;
  categoryId: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  existingImageIds: string[];
  existingImageUrls: string[];
  documentFiles: File[];
  existingDocumentIds: string[];
  existingDocumentUrls: string[];
}

export const useSiteDataEdit = () => {
  const { 
    updateSiteIncome, 
    updateSiteExpense, 
    deleteSiteIncome, 
    deleteSiteExpense 
  } = useTransactions();
  const { alert, showSuccess, showError } = useAlert();
  
  // 現場入金編集用の状態
  const [editingIncome, setEditingIncome] = useState<SiteIncome | null>(null);
  const [incomeEditForm, setIncomeEditForm] = useState<SiteIncomeEditForm>({
    amount: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    existingImageIds: [],
    existingImageUrls: [],
    documentFiles: [],
    existingDocumentIds: [],
    existingDocumentUrls: []
  });

  // 現場支出編集用の状態
  const [editingExpense, setEditingExpense] = useState<SiteExpense | null>(null);
  const [expenseEditForm, setExpenseEditForm] = useState<SiteExpenseEditForm>({
    amount: '',
    categoryId: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    existingImageIds: [],
    existingImageUrls: [],
    documentFiles: [],
    existingDocumentIds: [],
    existingDocumentUrls: []
  });

  // 現場入金編集開始
  const startIncomeEdit = (income: SiteIncome) => {
    console.log('📝 現場入金編集開始', income);
    setEditingIncome(income);
    setIncomeEditForm({
      amount: income.amount.toString(),
      content: income.content || '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: income.imageIds || [],
      existingImageUrls: income.imageUrls || [],
      documentFiles: [],
      existingDocumentIds: income.documentIds || [],
      existingDocumentUrls: income.documentUrls || []
    });
  };

  // 現場支出編集開始
  const startExpenseEdit = (expense: SiteExpense) => {
    console.log('📝 現場支出編集開始', {
      expense,
      expenseAmount: expense.amount,
      expenseAmountType: typeof expense.amount,
      expenseAmountString: expense.amount.toString()
    });
    setEditingExpense(expense);
    const newForm = {
      amount: expense.amount.toString(),
      categoryId: expense.categoryId,
      content: expense.content || '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: expense.imageIds || [],
      existingImageUrls: expense.imageUrls || [],
      documentFiles: [],
      existingDocumentIds: expense.documentIds || [],
      existingDocumentUrls: expense.documentUrls || []
    };
    console.log('📝 支出編集フォーム設定', newForm);
    setExpenseEditForm(newForm);
  };

  // 編集キャンセル
  const cancelIncomeEdit = () => {
    setEditingIncome(null);
    setIncomeEditForm({ 
      amount: '', 
      content: '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: [],
      existingImageUrls: [],
      documentFiles: [],
      existingDocumentIds: [],
      existingDocumentUrls: []
    });
  };

  const cancelExpenseEdit = () => {
    setEditingExpense(null);
    setExpenseEditForm({ 
      amount: '', 
      categoryId: '', 
      content: '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: [],
      existingImageUrls: [],
      documentFiles: [],
      existingDocumentIds: [],
      existingDocumentUrls: []
    });
  };

  // フォーム更新
  const updateIncomeEditForm = (field: keyof SiteIncomeEditForm, value: string | File[] | string[]) => {
    setIncomeEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateExpenseEditForm = (field: keyof SiteExpenseEditForm, value: string | File[] | string[]) => {
    setExpenseEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 画像処理関数（入金用）
  const handleIncomeImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const nextFiles = [...incomeEditForm.imageFiles, ...fileArray].slice(0, 5);
    
    const previews = await Promise.all(
      nextFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    
    setIncomeEditForm(prev => ({
      ...prev,
      imageFiles: nextFiles,
      imagePreviews: previews
    }));
  };

  const handleIncomeImageRemove = (index: number) => {
    setIncomeEditForm(prev => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleIncomeExistingImageRemove = (index: number, type: 'local' | 'firebase') => {
    console.log('🗑️ 入金画像削除開始', {
      index,
      type,
      currentImageIds: incomeEditForm.existingImageIds,
      currentImageUrls: incomeEditForm.existingImageUrls
    });

    if (type === 'local') {
      const imageIdToDelete = incomeEditForm.existingImageIds[index];
      if (imageIdToDelete && editingIncome) {
        console.log('🗑️ 入金ローカル画像削除:', { imageId: imageIdToDelete, incomeId: editingIncome.id });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromLocalStorage(editingIncome.id, imageIdToDelete);
      }
      setIncomeEditForm(prev => {
        const newImageIds = prev.existingImageIds.filter((_, i) => i !== index);
        console.log('📝  入金ローカル画像ID更新', { before: prev.existingImageIds, after: newImageIds });
        return {
          ...prev,
          existingImageIds: newImageIds
        };
      });
    } else {
      const imageUrlToDelete = incomeEditForm.existingImageUrls[index];
      if (imageUrlToDelete) {
        console.log('🗑️ 入金Firebase画像削除:', { imageUrl: imageUrlToDelete });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromFirebaseStorage(imageUrlToDelete).catch((error: any) => {
          console.warn('⚠️ Firebase画像削除失敗（続行）:', error);
        });
      }
      setIncomeEditForm(prev => {
        const newImageUrls = prev.existingImageUrls.filter((_, i) => i !== index);
        console.log('📝 入金Firebase画像URL更新', { before: prev.existingImageUrls, after: newImageUrls });
        return {
          ...prev,
          existingImageUrls: newImageUrls
        };
      });
    }
  };

  // 画像処理関数（支出用）
  const handleExpenseImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const nextFiles = [...expenseEditForm.imageFiles, ...fileArray].slice(0, 5);
    
    const previews = await Promise.all(
      nextFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    
    setExpenseEditForm(prev => ({
      ...prev,
      imageFiles: nextFiles,
      imagePreviews: previews
    }));
  };

  const handleExpenseImageRemove = (index: number) => {
    setExpenseEditForm(prev => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const handleExpenseExistingImageRemove = (index: number, type: 'local' | 'firebase') => {
    console.log('🗑️ 支出画像削除開始', {
      index,
      type,
      currentImageIds: expenseEditForm.existingImageIds,
      currentImageUrls: expenseEditForm.existingImageUrls
    });

    if (type === 'local') {
      const imageIdToDelete = expenseEditForm.existingImageIds[index];
      if (imageIdToDelete && editingExpense) {
        console.log('🗑️ 支出ローカル画像削除:', { imageId: imageIdToDelete, expenseId: editingExpense.id });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromLocalStorage(editingExpense.id, imageIdToDelete);
      }
      setExpenseEditForm(prev => {
        const newImageIds = prev.existingImageIds.filter((_, i) => i !== index);
        console.log('📝 支出ローカル画像ID更新', { before: prev.existingImageIds, after: newImageIds });
        return {
          ...prev,
          existingImageIds: newImageIds
        };
      });
    } else {
      const imageUrlToDelete = expenseEditForm.existingImageUrls[index];
      if (imageUrlToDelete) {
        console.log('🗑️ 支出Firebase画像削除:', { imageUrl: imageUrlToDelete });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromFirebaseStorage(imageUrlToDelete).catch((error: any) => {
          console.warn('⚠️ Firebase画像削除失敗（続行）:', error);
        });
      }
      setExpenseEditForm(prev => {
        const newImageUrls = prev.existingImageUrls.filter((_, i) => i !== index);
        console.log('📝 支出Firebase画像URL更新', { before: prev.existingImageUrls, after: newImageUrls });
        return {
          ...prev,
          existingImageUrls: newImageUrls
        };
      });
    }
  };

  // 現場入金保存
  const handleIncomeSave = async () => {
    if (!editingIncome) {
      console.log('❌ 編集対象の現場入金がありません');
      return;
    }

    console.log('💾 現場入金編集保存開始', {
      incomeId: editingIncome.id,
      editForm: incomeEditForm
    });

    // バリデーション
    if (!incomeEditForm.amount || isNaN(Number(incomeEditForm.amount)) || Number(incomeEditForm.amount) <= 0) {
      console.log('❌ 金額バリデーションエラー', incomeEditForm.amount);
      showError('正しい金額を入力してください');
      return;
    }

    try {
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];
      let newDocumentIds: string[] = [];
      let newDocumentUrls: string[] = [];
      let combinedSaveReport = '';

      // 新しい画像がある場合は保存処理
      if (incomeEditForm.imageFiles && incomeEditForm.imageFiles.length > 0) {
        try {
          const results = await saveImagesHybridBatch(editingIncome.id, incomeEditForm.imageFiles);
          newImageIds = results.filter(r => r.imageId).map(r => r.imageId!);
          newImageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
          
          console.log('🖼️ 入金画像保存結果:', {
            imageIds: newImageIds,
            imageUrls: newImageUrls
          });
        } catch (imageError) {
          console.error('画像保存エラー:', imageError);
          // 画像保存エラーは致命的ではないため、続行
        }
      }

      // 新しい書類がある場合は保存処理
      if (incomeEditForm.documentFiles && incomeEditForm.documentFiles.length > 0) {
        try {
          console.log('📄 現場入金書類ハイブリッド保存開始', {
            transactionId: editingIncome.id,
            fileCount: incomeEditForm.documentFiles.length
          });
          
          const results = await saveDocumentsHybridBatch(editingIncome.id, incomeEditForm.documentFiles);
          newDocumentIds = results.filter(r => r.documentId).map(r => r.documentId!);
          newDocumentUrls = results.filter(r => r.documentUrl).map(r => r.documentUrl!);
          
          const localCount = results.filter(r => r.saveMethod === 'local').length;
          const firebaseCount = results.filter(r => r.saveMethod === 'firebase').length;
          
          combinedSaveReport = `書類${results.length}件保存完了`;
          if (localCount > 0 && firebaseCount > 0) {
            combinedSaveReport += ` (クラウド: ${firebaseCount}件、ローカル: ${localCount}件)`;
          } else if (firebaseCount > 0) {
            combinedSaveReport += ` (クラウド保存・デバイス間同期対応)`;
          } else if (localCount > 0) {
            combinedSaveReport += ` (ローカル保存・Firebase準備中)`;
          }
          
          console.log('✅ 現場入金書類ハイブリッド保存完了', {
            成功数: results.length,
            ローカル: localCount,
            Firebase: firebaseCount,
            documentIds: newDocumentIds,
            documentUrls: newDocumentUrls
          });
        } catch (documentError) {
          console.error('書類保存エラー:', documentError);
          showError(`書類の保存に失敗しました: ${documentError}`);
          return; // 書類保存失敗時は処理を中断
        }
      }

      // 最終的なファイルデータを計算（削除されたものは除外）
      const allImageIds = [...incomeEditForm.existingImageIds, ...newImageIds];
      const allImageUrls = [...incomeEditForm.existingImageUrls, ...newImageUrls];
      const allDocumentIds = [...incomeEditForm.existingDocumentIds, ...newDocumentIds];
      const allDocumentUrls = [...incomeEditForm.existingDocumentUrls, ...newDocumentUrls];

      // 削除されたファイルのログ出力と処理
      const originalDocumentIds = editingIncome.documentIds || [];
      const originalDocumentUrls = editingIncome.documentUrls || [];
      const deletedDocumentIds = originalDocumentIds.filter(id => !allDocumentIds.includes(id));
      const deletedDocumentUrls = originalDocumentUrls.filter(url => !allDocumentUrls.includes(url));
      
      if (deletedDocumentIds.length > 0) {
        console.log('🗑️ 削除された入金書類ID', deletedDocumentIds);
        deletedDocumentIds.forEach(documentId => {
          deleteDocumentFromLocalStorage(editingIncome.id, documentId);
        });
      }

      if (deletedDocumentUrls.length > 0) {
        console.log('🗑️ 削除された入金書類URL', deletedDocumentUrls);
      }

      console.log('🖼️📄 入金ファイルデータ計算', {
        existingImageIds: incomeEditForm.existingImageIds,
        existingImageUrls: incomeEditForm.existingImageUrls,
        existingDocumentIds: incomeEditForm.existingDocumentIds,
        existingDocumentUrls: incomeEditForm.existingDocumentUrls,
        newImageIds,
        newImageUrls,
        newDocumentIds,
        newDocumentUrls,
        allImageIds,
        allImageUrls,
        allDocumentIds,
        allDocumentUrls,
        deletedDocumentIds,
        deletedDocumentUrls
      });

      const updateData: any = {
        amount: Number(incomeEditForm.amount),
        content: incomeEditForm.content
      };

      // ファイルデータを追加（空の配列でも設定して削除を反映）
      updateData.imageIds = allImageIds;
      updateData.imageUrls = allImageUrls;
      updateData.documentIds = allDocumentIds;
      updateData.documentUrls = allDocumentUrls;
      
      console.log('💾 現場入金更新データ', updateData);
      
      await updateSiteIncome(editingIncome.id, updateData);
      console.log('✅ 現場入金更新完了');
      
      const successMessage = combinedSaveReport ? 
        `現場入金を更新しました！${combinedSaveReport}` : 
        '現場入金を更新しました！';
      showSuccess(successMessage);
      setEditingIncome(null);
      setIncomeEditForm({ 
        amount: '', 
        content: '',
        imageFiles: [],
        imagePreviews: [],
        existingImageIds: [],
        existingImageUrls: [],
        documentFiles: [],
        existingDocumentIds: [],
        existingDocumentUrls: []
      });
    } catch (error: any) {
      console.error('❌ 現場入金編集保存エラー', error);
      showError(`更新に失敗しました: ${error.message || 'Unknown error'}`);
    }
  };

  // 現場支出保存
  const handleExpenseSave = async () => {
    if (!editingExpense) {
      console.log('❌ 編集対象の現場支出がありません');
      return;
    }

    console.log('💾 現場支出編集保存開始', {
      expenseId: editingExpense.id,
      editForm: expenseEditForm
    });

    // バリデーション
    if (!expenseEditForm.amount || isNaN(Number(expenseEditForm.amount)) || Number(expenseEditForm.amount) <= 0) {
      console.log('❌ 金額バリデーションエラー', expenseEditForm.amount);
      showError('正しい金額を入力してください');
      return;
    }

    if (!expenseEditForm.categoryId) {
      console.log('❌ カテゴリーバリデーションエラー', expenseEditForm.categoryId);
      showError('カテゴリーを選択してください');
      return;
    }

    try {
      let newImageIds: string[] = [];
      let newImageUrls: string[] = [];
      let newDocumentIds: string[] = [];
      let newDocumentUrls: string[] = [];
      let combinedSaveReport = '';

      // 新しい画像がある場合は保存処理
      if (expenseEditForm.imageFiles && expenseEditForm.imageFiles.length > 0) {
        try {
          const results = await saveImagesHybridBatch(editingExpense.id, expenseEditForm.imageFiles);
          newImageIds = results.filter(r => r.imageId).map(r => r.imageId!);
          newImageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
          
          console.log('🖼️ 支出画像保存結果:', {
            imageIds: newImageIds,
            imageUrls: newImageUrls
          });
        } catch (imageError) {
          console.error('画像保存エラー:', imageError);
          // 画像保存エラーは致命的ではないため、続行
        }
      }

      // 新しい書類がある場合は保存処理
      if (expenseEditForm.documentFiles && expenseEditForm.documentFiles.length > 0) {
        try {
          console.log('📄 現場支出書類ハイブリッド保存開始', {
            transactionId: editingExpense.id,
            fileCount: expenseEditForm.documentFiles.length
          });
          
          const results = await saveDocumentsHybridBatch(editingExpense.id, expenseEditForm.documentFiles);
          newDocumentIds = results.filter(r => r.documentId).map(r => r.documentId!);
          newDocumentUrls = results.filter(r => r.documentUrl).map(r => r.documentUrl!);
          
          const localCount = results.filter(r => r.saveMethod === 'local').length;
          const firebaseCount = results.filter(r => r.saveMethod === 'firebase').length;
          
          combinedSaveReport = `書類${results.length}件保存完了`;
          if (localCount > 0 && firebaseCount > 0) {
            combinedSaveReport += ` (クラウド: ${firebaseCount}件、ローカル: ${localCount}件)`;
          } else if (firebaseCount > 0) {
            combinedSaveReport += ` (クラウド保存・デバイス間同期対応)`;
          } else if (localCount > 0) {
            combinedSaveReport += ` (ローカル保存・Firebase準備中)`;
          }
          
          console.log('✅ 現場支出書類ハイブリッド保存完了', {
            成功数: results.length,
            ローカル: localCount,
            Firebase: firebaseCount,
            documentIds: newDocumentIds,
            documentUrls: newDocumentUrls
          });
        } catch (documentError) {
          console.error('書類保存エラー:', documentError);
          showError(`書類の保存に失敗しました: ${documentError}`);
          return; // 書類保存失敗時は処理を中断
        }
      }

      // 最終的なファイルデータを計算（削除されたものは除外）
      const allImageIds = [...expenseEditForm.existingImageIds, ...newImageIds];
      const allImageUrls = [...expenseEditForm.existingImageUrls, ...newImageUrls];
      const allDocumentIds = [...expenseEditForm.existingDocumentIds, ...newDocumentIds];
      const allDocumentUrls = [...expenseEditForm.existingDocumentUrls, ...newDocumentUrls];

      // 削除されたファイルのログ出力と処理
      const originalDocumentIds = editingExpense.documentIds || [];
      const originalDocumentUrls = editingExpense.documentUrls || [];
      const deletedDocumentIds = originalDocumentIds.filter(id => !allDocumentIds.includes(id));
      const deletedDocumentUrls = originalDocumentUrls.filter(url => !allDocumentUrls.includes(url));
      
      if (deletedDocumentIds.length > 0) {
        console.log('🗑️ 削除された支出書類ID', deletedDocumentIds);
        deletedDocumentIds.forEach(documentId => {
          deleteDocumentFromLocalStorage(editingExpense.id, documentId);
        });
      }

      if (deletedDocumentUrls.length > 0) {
        console.log('🗑️ 削除された支出書類URL', deletedDocumentUrls);
      }

      console.log('🖼️📄 支出ファイルデータ計算', {
        existingImageIds: expenseEditForm.existingImageIds,
        existingImageUrls: expenseEditForm.existingImageUrls,
        existingDocumentIds: expenseEditForm.existingDocumentIds,
        existingDocumentUrls: expenseEditForm.existingDocumentUrls,
        newImageIds,
        newImageUrls,
        newDocumentIds,
        newDocumentUrls,
        allImageIds,
        allImageUrls,
        allDocumentIds,
        allDocumentUrls,
        deletedDocumentIds,
        deletedDocumentUrls
      });

      const updateData: any = {
        amount: Number(expenseEditForm.amount),
        categoryId: expenseEditForm.categoryId,
        content: expenseEditForm.content
      };

      // ファイルデータを追加（空の配列でも設定して削除を反映）
      updateData.imageIds = allImageIds;
      updateData.imageUrls = allImageUrls;
      updateData.documentIds = allDocumentIds;
      updateData.documentUrls = allDocumentUrls;
      
      console.log('💾 現場支出更新データ', updateData);
      
      await updateSiteExpense(editingExpense.id, updateData);
      console.log('✅ 現場支出更新完了');
      
      const successMessage = combinedSaveReport ? 
        `現場支出を更新しました！${combinedSaveReport}` : 
        '現場支出を更新しました！';
      showSuccess(successMessage);
      setEditingExpense(null);
      setExpenseEditForm({ 
        amount: '', 
        categoryId: '', 
        content: '',
        imageFiles: [],
        imagePreviews: [],
        existingImageIds: [],
        existingImageUrls: [],
        documentFiles: [],
        existingDocumentIds: [],
        existingDocumentUrls: []
      });
    } catch (error: any) {
      console.error('❌ 現場支出編集保存エラー', error);
      showError(`更新に失敗しました: ${error.message || 'Unknown error'}`);
    }
  };

  // 削除処理
  const handleIncomeDelete = async (id: string) => {
    try {
      console.log('🗑️ 現場入金削除開始', id);
      await deleteSiteIncome(id);
      console.log('✅ 現場入金削除完了');
      showSuccess('現場入金を削除しました');
    } catch (error: any) {
      console.error('❌ 現場入金削除エラー', error);
      showError(`削除に失敗しました: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExpenseDelete = async (id: string) => {
    try {
      console.log('🗑️ 現場支出削除開始', id);
      await deleteSiteExpense(id);
      console.log('✅ 現場支出削除完了');
      showSuccess('現場支出を削除しました');
    } catch (error: any) {
      console.error('❌ 現場支出削除エラー', error);
      showError(`削除に失敗しました: ${error.message || 'Unknown error'}`);
    }
  };

  return {
    // 現場入金編集用
    editingIncome,
    incomeEditForm,
    startIncomeEdit,
    cancelIncomeEdit,
    updateIncomeEditForm,
    handleIncomeSave,
    handleIncomeDelete,
    handleIncomeImageSelect,
    handleIncomeImageRemove,
    handleIncomeExistingImageRemove,
    
    // 現場支出編集用
    editingExpense,
    expenseEditForm,
    startExpenseEdit,
    cancelExpenseEdit,
    updateExpenseEditForm,
    handleExpenseSave,
    handleExpenseDelete,
    handleExpenseImageSelect,
    handleExpenseImageRemove,
    handleExpenseExistingImageRemove,
    
    // 共通
    alert
  };
};
