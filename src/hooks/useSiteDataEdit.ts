import { useState } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { SiteIncome, SiteExpense } from '../types';
import { useAlert } from './useAlert';
import { saveImagesHybridBatch } from '../utils/imageUtils';

export interface SiteIncomeEditForm {
  amount: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  existingImageIds: string[];
  existingImageUrls: string[];
}

export interface SiteExpenseEditForm {
  amount: string;
  categoryId: string;
  content: string;
  imageFiles: File[];
  imagePreviews: string[];
  existingImageIds: string[];
  existingImageUrls: string[];
}

export const useSiteDataEdit = () => {
  const { 
    updateSiteIncome, 
    updateSiteExpense, 
    deleteSiteIncome, 
    deleteSiteExpense 
  } = useTransactions();
  const { alert, showSuccess, showError } = useAlert();
  
  // 現場収入編集用の状態
  const [editingIncome, setEditingIncome] = useState<SiteIncome | null>(null);
  const [incomeEditForm, setIncomeEditForm] = useState<SiteIncomeEditForm>({
    amount: '',
    content: '',
    imageFiles: [],
    imagePreviews: [],
    existingImageIds: [],
    existingImageUrls: []
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
    existingImageUrls: []
  });

  // 現場収入編集開始
  const startIncomeEdit = (income: SiteIncome) => {
    console.log('📝 現場収入編集開始', income);
    setEditingIncome(income);
    setIncomeEditForm({
      amount: income.amount.toString(),
      content: income.content || '',
      imageFiles: [],
      imagePreviews: [],
      existingImageIds: income.imageIds || [],
      existingImageUrls: income.imageUrls || []
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
      existingImageUrls: expense.imageUrls || []
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
      existingImageUrls: []
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
      existingImageUrls: []
    });
  };

  // フォーム更新
  const updateIncomeEditForm = (field: keyof SiteIncomeEditForm, value: string | File[] | string[]) => {
    setIncomeEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateExpenseEditForm = (field: keyof SiteExpenseEditForm, value: string | File[] | string[]) => {
    setExpenseEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 画像処理関数（収入用）
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
    console.log('🗑️ 収入画像削除開始', {
      index,
      type,
      currentImageIds: incomeEditForm.existingImageIds,
      currentImageUrls: incomeEditForm.existingImageUrls
    });

    if (type === 'local') {
      const imageIdToDelete = incomeEditForm.existingImageIds[index];
      if (imageIdToDelete && editingIncome) {
        console.log('🗑️ 収入ローカル画像削除:', { imageId: imageIdToDelete, incomeId: editingIncome.id });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromLocalStorage(editingIncome.id, imageIdToDelete);
      }
      setIncomeEditForm(prev => {
        const newImageIds = prev.existingImageIds.filter((_, i) => i !== index);
        console.log('📝 収入ローカル画像ID更新', { before: prev.existingImageIds, after: newImageIds });
        return {
          ...prev,
          existingImageIds: newImageIds
        };
      });
    } else {
      const imageUrlToDelete = incomeEditForm.existingImageUrls[index];
      if (imageUrlToDelete) {
        console.log('🗑️ 収入Firebase画像削除:', { imageUrl: imageUrlToDelete });
        const imageUtils = require('../utils/imageUtils');
        imageUtils.deleteImageFromFirebaseStorage(imageUrlToDelete).catch((error: any) => {
          console.warn('⚠️ Firebase画像削除失敗（続行）:', error);
        });
      }
      setIncomeEditForm(prev => {
        const newImageUrls = prev.existingImageUrls.filter((_, i) => i !== index);
        console.log('📝 収入Firebase画像URL更新', { before: prev.existingImageUrls, after: newImageUrls });
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

  // 現場収入保存
  const handleIncomeSave = async () => {
    if (!editingIncome) {
      console.log('❌ 編集対象の現場収入がありません');
      return;
    }

    console.log('💾 現場収入編集保存開始', {
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

      // 新しい画像がある場合は保存処理
      if (incomeEditForm.imageFiles && incomeEditForm.imageFiles.length > 0) {
        try {
          const results = await saveImagesHybridBatch(editingIncome.id, incomeEditForm.imageFiles);
          newImageIds = results.filter(r => r.imageId).map(r => r.imageId!);
          newImageUrls = results.filter(r => r.imageUrl).map(r => r.imageUrl!);
          
          console.log('🖼️ 収入画像保存結果:', {
            imageIds: newImageIds,
            imageUrls: newImageUrls
          });
        } catch (imageError) {
          console.error('画像保存エラー:', imageError);
          // 画像保存エラーは致命的ではないため、続行
        }
      }

      // 最終的な画像データを計算（削除されたものは除外）
      const allImageIds = [...incomeEditForm.existingImageIds, ...newImageIds];
      const allImageUrls = [...incomeEditForm.existingImageUrls, ...newImageUrls];

      console.log('🖼️ 収入画像データ計算', {
        existingImageIds: incomeEditForm.existingImageIds,
        existingImageUrls: incomeEditForm.existingImageUrls,
        newImageIds,
        newImageUrls,
        allImageIds,
        allImageUrls
      });

      const updateData: any = {
        amount: Number(incomeEditForm.amount),
        content: incomeEditForm.content
      };

      // 画像データがある場合は追加（空の配列でも設定して削除を反映）
      updateData.imageIds = allImageIds;
      updateData.imageUrls = allImageUrls;
      
      console.log('💾 現場収入更新データ', updateData);
      
      await updateSiteIncome(editingIncome.id, updateData);
      console.log('✅ 現場収入更新完了');
      
      showSuccess('現場収入を更新しました！');
      setEditingIncome(null);
      setIncomeEditForm({ 
        amount: '', 
        content: '',
        imageFiles: [],
        imagePreviews: [],
        existingImageIds: [],
        existingImageUrls: []
      });
    } catch (error: any) {
      console.error('❌ 現場収入編集保存エラー', error);
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

      // 最終的な画像データを計算（削除されたものは除外）
      const allImageIds = [...expenseEditForm.existingImageIds, ...newImageIds];
      const allImageUrls = [...expenseEditForm.existingImageUrls, ...newImageUrls];

      console.log('🖼️ 支出画像データ計算', {
        existingImageIds: expenseEditForm.existingImageIds,
        existingImageUrls: expenseEditForm.existingImageUrls,
        newImageIds,
        newImageUrls,
        allImageIds,
        allImageUrls
      });

      const updateData: any = {
        amount: Number(expenseEditForm.amount),
        categoryId: expenseEditForm.categoryId,
        content: expenseEditForm.content
      };

      // 画像データがある場合は追加（空の配列でも設定して削除を反映）
      updateData.imageIds = allImageIds;
      updateData.imageUrls = allImageUrls;
      
      console.log('💾 現場支出更新データ', updateData);
      
      await updateSiteExpense(editingExpense.id, updateData);
      console.log('✅ 現場支出更新完了');
      
      showSuccess('現場支出を更新しました！');
      setEditingExpense(null);
      setExpenseEditForm({ 
        amount: '', 
        categoryId: '', 
        content: '',
        imageFiles: [],
        imagePreviews: [],
        existingImageIds: [],
        existingImageUrls: []
      });
    } catch (error: any) {
      console.error('❌ 現場支出編集保存エラー', error);
      showError(`更新に失敗しました: ${error.message || 'Unknown error'}`);
    }
  };

  // 削除処理
  const handleIncomeDelete = async (id: string) => {
    try {
      console.log('🗑️ 現場収入削除開始', id);
      await deleteSiteIncome(id);
      console.log('✅ 現場収入削除完了');
      showSuccess('現場収入を削除しました');
    } catch (error: any) {
      console.error('❌ 現場収入削除エラー', error);
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
    // 現場収入編集用
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
