import { useState } from 'react';

interface ImageModalState {
  src: string;
  alt: string;
}

interface AllItemsModalState {
  type: 'photos' | 'documents';
  categoryName: string;
  items: any[];
}

export const useModalManager = () => {
  // 画像拡大表示モーダル
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageModalState | null>(null);
  
  // すべてのアイテム表示モーダル
  const [allItemsModalOpen, setAllItemsModalOpen] = useState(false);
  const [allItemsData, setAllItemsData] = useState<AllItemsModalState | null>(null);

  // 画像クリックハンドラー
  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt });
    setImageModalOpen(true);
  };

  // 画像モーダルを閉じる
  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // すべてのアイテムを表示するハンドラー
  const handleShowAllItems = (type: 'photos' | 'documents', categoryName: string, items: any[]) => {
    setAllItemsData({ type, categoryName, items });
    setAllItemsModalOpen(true);
  };

  // すべてのアイテムモーダルを閉じる
  const handleAllItemsModalClose = () => {
    setAllItemsModalOpen(false);
    setAllItemsData(null);
  };

  return {
    // 画像モーダル関連
    imageModalOpen,
    selectedImage,
    handleImageClick,
    handleImageModalClose,
    
    // すべてのアイテムモーダル関連
    allItemsModalOpen,
    allItemsData,
    handleShowAllItems,
    handleAllItemsModalClose
  };
};
