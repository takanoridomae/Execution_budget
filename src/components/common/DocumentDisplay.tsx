import React from 'react';
import { Box, Typography } from '@mui/material';
import { AttachFile as AttachFileIcon } from '@mui/icons-material';
import { getAllDocumentsForEntity } from '../../utils/documentUtils';

interface DocumentDisplayProps {
  documentIds?: string[];
  documentUrls?: string[];
  entityId: string;
  maxDisplay?: number;
  onShowAll?: () => void;
  showCounter?: boolean;
  compact?: boolean;
}

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({
  documentIds = [],
  documentUrls = [],
  entityId,
  maxDisplay = 3,
  onShowAll,
  showCounter = true,
  compact = false
}) => {
  const totalDocuments = documentIds.length + documentUrls.length;
  
  if (totalDocuments === 0) {
    return null;
  }

  // 表示する書類を収集
  const displayDocuments: Array<{
    name: string;
    onClick: () => void;
    key: string;
  }> = [];
  
  // ローカルストレージの書類を追加
  documentIds.forEach((documentId, index) => {
    if (displayDocuments.length < maxDisplay) {
      const documents = getAllDocumentsForEntity(entityId);
      const documentInfo = documents.find(d => d.id === documentId);
      if (documentInfo) {
        displayDocuments.push({
          name: documentInfo.fileName,
          key: `local-doc-${index}`,
          onClick: () => {
            try {
              const content = localStorage.getItem(`document_${entityId}_${documentId}`);
              if (content) {
                const link = document.createElement('a');
                link.href = content;
                link.download = documentInfo.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            } catch (error) {
              console.error('書類ダウンロードエラー:', error);
            }
          }
        });
      }
    }
  });
  
  // Firebase Storageの書類を追加（残り枠まで）
  if (displayDocuments.length < maxDisplay) {
    documentUrls.slice(0, maxDisplay - displayDocuments.length).forEach((url, index) => {
      const fileName = url.split('/').pop()?.split('_').slice(1).join('_') || `書類-${index + 1}`;
      displayDocuments.push({
        name: fileName,
        key: `firebase-doc-${index}`,
        onClick: () => window.open(url, '_blank')
      });
    });
  }

  if (compact) {
    return (
      <Box>
        {showCounter && (
          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
            <AttachFileIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              書類登録済み ({totalDocuments}件)
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {showCounter && (
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <AttachFileIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            書類 ({totalDocuments}件)
          </Typography>
        </Box>
      )}
      <Box display="flex" flexDirection="column" gap={0.25}>
        {displayDocuments.map((doc) => (
          <Typography
            key={doc.key}
            variant="caption"
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              color: 'primary.main',
              '&:hover': { color: 'primary.dark' },
              fontSize: '0.65rem'
            }}
            onClick={doc.onClick}
          >
            📎 {doc.name}
          </Typography>
        ))}
        
        {/* 追加書類がある場合の表示 */}
        {totalDocuments > maxDisplay && (
          <Typography 
            variant="caption" 
            sx={{
              color: 'primary.main',
              fontSize: '0.65rem',
              cursor: onShowAll ? 'pointer' : 'default',
              textDecoration: onShowAll ? 'underline' : 'none',
              '&:hover': onShowAll ? {
                color: 'primary.dark'
              } : {}
            }}
            onClick={onShowAll}
          >
            +{totalDocuments - maxDisplay}件の書類を表示
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DocumentDisplay;
