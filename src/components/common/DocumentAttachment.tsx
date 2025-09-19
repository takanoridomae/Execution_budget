import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  Storage as LocalStorageIcon
} from '@mui/icons-material';
import {
  SUPPORTED_DOCUMENT_TYPES,
  validateFileSize,
  validateFileType,
  getDocumentIcon,
  formatFileSize,
  getAllDocumentsForEntity,
  getDocumentFromLocalStorage
} from '../../utils/documentUtils';

export interface DocumentInfo {
  id?: string;
  url?: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  source: 'local' | 'firebase';
  size?: number;
  file?: File; // 新しく選択されたファイル用
}

interface DocumentAttachmentProps {
  entityId: string;
  documents: DocumentInfo[];
  onDocumentsChange: (documents: DocumentInfo[]) => void;
  onFilesSelect?: (files: File[]) => void;
  onDocumentRemove?: (document: DocumentInfo, index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const DocumentAttachment: React.FC<DocumentAttachmentProps> = ({
  entityId,
  documents,
  onDocumentsChange,
  onFilesSelect,
  onDocumentRemove,
  maxFiles = 5,
  disabled = false,
  label = "書類を添付",
  helperText = "PDF、Word、Excel、PowerPoint、テキストファイルなど（最大10MB）"
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // ファイル選択処理
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError('');
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // ファイル検証
    fileArray.forEach((file) => {
      if (!validateFileType(file)) {
        errors.push(`${file.name}: サポートされていないファイル形式です`);
        return;
      }
      
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: ファイルサイズが10MBを超えています`);
        return;
      }
      
      if (documents.length + validFiles.length >= maxFiles) {
        errors.push(`最大${maxFiles}件まで添付できます`);
        return;
      }
      
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      // 内部状態を更新（プレビュー用）
      setNewFiles(prev => [...prev, ...validFiles]);
      
      // 親コンポーネントに通知
      if (onFilesSelect) {
        onFilesSelect(validFiles);
      }
      
      // DocumentInfo形式に変換して親の状態も更新
      const newDocuments: DocumentInfo[] = validFiles.map(file => ({
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        source: 'local' as const,
        size: file.size,
        file: file
      }));
      
      const updatedDocuments = [...documents, ...newDocuments];
      onDocumentsChange(updatedDocuments);
    }
  };

  // ドラッグ＆ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 書類削除処理
  const handleDocumentRemove = (document: DocumentInfo, index: number) => {
    // 新しく選択されたファイルの削除
    if (document.file) {
      setNewFiles(prev => prev.filter(f => f !== document.file));
    }
    
    if (onDocumentRemove) {
      onDocumentRemove(document, index);
    } else {
      // デフォルト削除処理
      const newDocuments = documents.filter((_, i) => i !== index);
      onDocumentsChange(newDocuments);
    }
  };

  // 書類ダウンロード処理
  const handleDocumentDownload = (documentInfo: DocumentInfo) => {
    if (documentInfo.source === 'local' && documentInfo.id) {
      const docData = getDocumentFromLocalStorage(entityId, documentInfo.id);
      if (docData) {
        // Base64データからダウンロード
        const link = document.createElement('a');
        link.href = docData.data;
        link.download = docData.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (documentInfo.source === 'firebase' && documentInfo.url) {
      // Firebase URLから直接ダウンロード
      window.open(documentInfo.url, '_blank');
    }
  };

  // サポートされているファイル形式の表示
  const getSupportedFormats = (): string => {
    const extensions: string[] = [];
    Object.values(SUPPORTED_DOCUMENT_TYPES).forEach(exts => {
      extensions.push(...exts);
    });
    return extensions.join(', ');
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>

      {/* ファイル選択エリア */}
      <Box
        sx={{
          border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          transition: 'all 0.2s ease',
          mb: 2
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          ファイルをドラッグ＆ドロップ または
        </Typography>
        
        <Button
          variant="outlined"
          component="label"
          startIcon={<AttachFileIcon />}
          disabled={disabled || documents.length >= maxFiles}
          sx={{ mb: 1 }}
        >
          ファイル選択
          <input
            type="file"
            hidden
            multiple
            accept={Object.keys(SUPPORTED_DOCUMENT_TYPES).join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </Button>

        <Typography variant="body2" color="text.secondary">
          {helperText}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          サポート形式: {getSupportedFormats()}
        </Typography>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 添付ファイル一覧 */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            添付書類 ({documents.length}/{maxFiles})
          </Typography>
          
          <List dense>
            {documents.map((document, index) => (
              <ListItem key={`${document.source}-${document.id || document.url}-${index}`}>
                <ListItemIcon>
                  <Typography sx={{ fontSize: 24 }}>
                    {getDocumentIcon(document.fileName)}
                  </Typography>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" noWrap>
                        {document.fileName}
                      </Typography>
                      <Chip
                        size="small"
                        icon={document.source === 'firebase' ? <CloudUploadIcon /> : <LocalStorageIcon />}
                        label={document.source === 'firebase' ? 'クラウド' : 'ローカル'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {document.size ? formatFileSize(document.size) : ''} • {new Date(document.uploadedAt).toLocaleString('ja-JP')}
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Tooltip title="ダウンロード">
                    <IconButton
                      size="small"
                      onClick={() => handleDocumentDownload(document)}
                      sx={{ mr: 1 }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="削除">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDocumentRemove(document, index)}
                      disabled={disabled}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* 容量制限警告 */}
      {documents.length >= maxFiles && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          最大{maxFiles}件まで添付できます。追加するには既存のファイルを削除してください。
        </Alert>
      )}
    </Box>
  );
};

export default DocumentAttachment;
