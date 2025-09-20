import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  RemoveCircle as RemoveCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  DataObject as DatabaseIcon,
  BrokenImage as BrokenImageIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  checkStorageIntegrity,
  saveIntegrityCheckResult,
  loadIntegrityCheckResult,
  fixRemoveDbReference,
  fixDeleteOrphanFile,
  fixAllBrokenLinks,
  fixAllOrphanFiles,
  saveIntegrityCheckHistory,
  debugCheckFileReference,
  IntegrityCheckResult,
  IntegrityIssue
} from '../utils/storageIntegrityUtils';

interface StorageIntegrityCheckerProps {
  open: boolean;
  onClose: () => void;
}

const StorageIntegrityChecker: React.FC<StorageIntegrityCheckerProps> = ({ open, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<IntegrityCheckResult | null>(null);
  const [fixingIssues, setFixingIssues] = useState<Set<string>>(new Set());
  const [isBatchFixing, setIsBatchFixing] = useState(false);

  // コンポーネントマウント時に保存された結果を読み込み
  useEffect(() => {
    if (open) {
      const savedResult = loadIntegrityCheckResult();
      if (savedResult) {
        setCheckResult(savedResult);
      }
    }
  }, [open]);

  // 整合性チェックを実行
  const handleRunCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkStorageIntegrity();
      setCheckResult(result);
      saveIntegrityCheckResult(result);
      saveIntegrityCheckHistory(result);
    } catch (error) {
      console.error('整合性チェックエラー:', error);
      alert('整合性チェック中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setIsChecking(false);
    }
  };

  // 問題のデバッグ
  const handleDebugIssue = async (issue: IntegrityIssue) => {
    if (issue.issueType === 'missing_in_db' && issue.storageFiles?.[0]) {
      try {
        const debugResult = await debugCheckFileReference(issue.storageFiles[0]);
        
        console.log('🔍 問題詳細デバッグ結果:', debugResult);
        
        const details = [
          `ファイルパス: ${issue.storageFiles[0]}`,
          `参照状況: ${debugResult.isReferenced ? '参照されている' : '参照されていない'}`,
          `StorageURL: ${debugResult.storageUrl?.substring(0, 100)}...`,
          `DB内URL総数: ${debugResult.dbUrls.length}`,
          `照合詳細: ${JSON.stringify(debugResult.matchDetails, null, 2)}`
        ].join('\n\n');
        
        alert(`デバッグ情報（詳細はコンソールを確認）:\n\n${details}`);
      } catch (error) {
        console.error('デバッグエラー:', error);
        alert('デバッグ中にエラーが発生しました。');
      }
    } else {
      alert('この問題タイプではデバッグ機能は利用できません。');
    }
  };

  // 問題の修正
  const handleFixIssue = async (issue: IntegrityIssue) => {
    setFixingIssues(prev => new Set(prev).add(issue.id));
    
    try {
      let success = false;
      
      if (issue.issueType === 'broken_url' || issue.issueType === 'missing_in_storage') {
        // DBから破損したURLを削除
        success = await fixRemoveDbReference(issue);
      } else if (issue.issueType === 'missing_in_db') {
        // 孤立したファイルを削除（確認後）
        const confirmed = window.confirm(
          `孤立したファイル "${issue.storageFiles?.[0] || '不明'}" を削除しますか？\n\n` +
          '⚠️ この操作は元に戻せません。ファイルが本当に不要であることを確認してください。'
        );
        
        if (confirmed) {
          success = await fixDeleteOrphanFile(issue);
        }
      }
      
      if (success) {
        // 結果から修正済みの問題を除去
        setCheckResult(prev => {
          if (!prev) return null;
          
          const updatedIssues = prev.issues.filter(i => i.id !== issue.id);
          const updatedSummary = {
            missingInStorage: updatedIssues.filter(i => i.issueType === 'missing_in_storage').length,
            missingInDb: updatedIssues.filter(i => i.issueType === 'missing_in_db').length,
            brokenUrls: updatedIssues.filter(i => i.issueType === 'broken_url').length
          };
          
          const updatedResult = {
            ...prev,
            issues: updatedIssues,
            summary: updatedSummary
          };
          
          saveIntegrityCheckResult(updatedResult);
          return updatedResult;
        });
        
        alert('修正が完了しました。');
      }
    } catch (error) {
      console.error('修正エラー:', error);
      alert('修正中にエラーが発生しました。コンソールをご確認ください。');
    } finally {
      setFixingIssues(prev => {
        const updated = new Set(prev);
        updated.delete(issue.id);
        return updated;
      });
    }
  };

  // 一括修正：破損リンク
  const handleFixAllBrokenLinks = async () => {
    if (!checkResult) return;
    
    const brokenIssues = checkResult.issues.filter(i => 
      i.issueType === 'broken_url' || i.issueType === 'missing_in_storage'
    );
    
    if (brokenIssues.length === 0) {
      alert('修正対象の破損リンクはありません。');
      return;
    }
    
    const confirmed = window.confirm(
      `${brokenIssues.length}件の破損リンクを一括で修正しますか？\n\n` +
      'この操作はデータベースから無効なURLを削除します。'
    );
    
    if (!confirmed) return;
    
    setIsBatchFixing(true);
    try {
      const result = await fixAllBrokenLinks(brokenIssues);
      
      if (result.fixed > 0) {
        // 修正された問題を結果から除去
        setCheckResult(prev => {
          if (!prev) return null;
          
          const fixedIds = new Set(brokenIssues.slice(0, result.fixed).map(i => i.id));
          const updatedIssues = prev.issues.filter(i => !fixedIds.has(i.id));
          const updatedSummary = {
            missingInStorage: updatedIssues.filter(i => i.issueType === 'missing_in_storage').length,
            missingInDb: updatedIssues.filter(i => i.issueType === 'missing_in_db').length,
            brokenUrls: updatedIssues.filter(i => i.issueType === 'broken_url').length
          };
          
          const updatedResult = { ...prev, issues: updatedIssues, summary: updatedSummary };
          saveIntegrityCheckResult(updatedResult);
          return updatedResult;
        });
      }
      
      alert(`一括修正完了\n✅ 修正: ${result.fixed}件\n❌ 失敗: ${result.failed}件`);
      
    } catch (error) {
      console.error('一括修正エラー:', error);
      alert('一括修正中にエラーが発生しました。');
    } finally {
      setIsBatchFixing(false);
    }
  };

  // 一括削除：孤立ファイル
  const handleDeleteAllOrphanFiles = async () => {
    if (!checkResult) return;
    
    const orphanIssues = checkResult.issues.filter(i => i.issueType === 'missing_in_db');
    
    if (orphanIssues.length === 0) {
      alert('削除対象の孤立ファイルはありません。');
      return;
    }
    
    const confirmed = window.confirm(
      `${orphanIssues.length}件の孤立ファイルを一括で削除しますか？\n\n` +
      '⚠️ この操作は元に戻せません。ファイルが本当に不要であることを確認してください。'
    );
    
    if (!confirmed) return;
    
    setIsBatchFixing(true);
    try {
      const result = await fixAllOrphanFiles(orphanIssues);
      
      if (result.deleted > 0) {
        // 削除された問題を結果から除去
        setCheckResult(prev => {
          if (!prev) return null;
          
          const deletedIds = new Set(orphanIssues.slice(0, result.deleted).map(i => i.id));
          const updatedIssues = prev.issues.filter(i => !deletedIds.has(i.id));
          const updatedSummary = {
            missingInStorage: updatedIssues.filter(i => i.issueType === 'missing_in_storage').length,
            missingInDb: updatedIssues.filter(i => i.issueType === 'missing_in_db').length,
            brokenUrls: updatedIssues.filter(i => i.issueType === 'broken_url').length
          };
          
          const updatedResult = { ...prev, issues: updatedIssues, summary: updatedSummary };
          saveIntegrityCheckResult(updatedResult);
          return updatedResult;
        });
      }
      
      alert(`一括削除完了\n✅ 削除: ${result.deleted}件\n❌ 失敗: ${result.failed}件`);
      
    } catch (error) {
      console.error('一括削除エラー:', error);
      alert('一括削除中にエラーが発生しました。');
    } finally {
      setIsBatchFixing(false);
    }
  };

  // 問題タイプのアイコンと色を取得
  const getIssueDisplayInfo = (issueType: string) => {
    switch (issueType) {
      case 'broken_url':
        return { icon: <BrokenImageIcon />, color: 'error' as const, label: '破損リンク' };
      case 'missing_in_storage':
        return { icon: <StorageIcon />, color: 'warning' as const, label: 'Storage欠如' };
      case 'missing_in_db':
        return { icon: <DatabaseIcon />, color: 'info' as const, label: 'DB未参照' };
      default:
        return { icon: <WarningIcon />, color: 'default' as const, label: '不明' };
    }
  };

  // エンティティタイプの表示名を取得
  const getEntityDisplayName = (entityType: string) => {
    switch (entityType) {
      case 'transaction': return 'トランザクション';
      case 'site': return '現場';
      case 'siteCategory': return '現場カテゴリ';
      case 'siteIncome': return '現場入金';
      case 'siteExpense': return '現場支出';
      default: return entityType;
    }
  };

  // 問題の重要度でソート
  const sortedIssues = checkResult?.issues.sort((a, b) => {
    const priorityOrder = { 'broken_url': 0, 'missing_in_storage': 1, 'missing_in_db': 2 };
    return priorityOrder[a.issueType] - priorityOrder[b.issueType];
  }) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <StorageIcon />
          Firebase Storage 整合性チェック
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} {...({} as any)}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRunCheck}
                disabled={isChecking}
                fullWidth
                size="large"
              >
                {isChecking ? '整合性チェック中...' : '整合性チェック実行'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6} {...({} as any)}>
              {checkResult && (
                <Typography variant="body2" color="textSecondary">
                  最終チェック: {new Date(checkResult.checkTimestamp).toLocaleString('ja-JP')}
                </Typography>
              )}
            </Grid>
          </Grid>
          
          {isChecking && (
            <Box mt={2}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" align="center" mt={1}>
                データベースとストレージの整合性を確認中...
              </Typography>
            </Box>
          )}
        </Box>

        {checkResult && (
          <>
            {/* サマリー */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                チェック結果サマリー
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3} {...({} as any)}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="primary">
                        {checkResult.totalChecked}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        チェック対象数
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3} {...({} as any)}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="error">
                        {checkResult.summary.brokenUrls}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        破損リンク
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3} {...({} as any)}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="warning">
                        {checkResult.summary.missingInStorage}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Storage欠如
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3} {...({} as any)}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="info">
                        {checkResult.summary.missingInDb}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        孤立ファイル
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* 結果表示 */}
            {checkResult.issues.length === 0 ? (
              <Alert severity="success">
                <AlertTitle>整合性OK</AlertTitle>
                データベースとFirebase Storageの整合性に問題は見つかりませんでした。
              </Alert>
            ) : (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>{checkResult.issues.length}件の整合性問題が見つかりました</AlertTitle>
                  各問題の詳細を確認し、必要に応じて修正してください。
                </Alert>

                {/* 一括修正ボタン */}
                <Box mb={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} {...({} as any)}>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<RemoveCircleIcon />}
                        onClick={handleFixAllBrokenLinks}
                        disabled={isBatchFixing || checkResult.issues.filter(i => i.issueType === 'broken_url' || i.issueType === 'missing_in_storage').length === 0}
                        fullWidth
                      >
                        {isBatchFixing ? '修正中...' : '破損リンクを一括修正'}
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} {...({} as any)}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteAllOrphanFiles}
                        disabled={isBatchFixing || checkResult.issues.filter(i => i.issueType === 'missing_in_db').length === 0}
                        fullWidth
                      >
                        {isBatchFixing ? '削除中...' : '孤立ファイルを一括削除'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {/* 問題タイプ別にグループ化 */}
                {['broken_url', 'missing_in_storage', 'missing_in_db'].map(issueType => {
                  const issuesOfType = sortedIssues.filter(issue => issue.issueType === issueType);
                  if (issuesOfType.length === 0) return null;

                  const displayInfo = getIssueDisplayInfo(issueType);

                  return (
                    <Accordion key={issueType} defaultExpanded={issueType === 'broken_url'}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {displayInfo.icon}
                          <Typography variant="h6">
                            {displayInfo.label} ({issuesOfType.length}件)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {issuesOfType.map((issue, index) => (
                            <React.Fragment key={issue.id}>
                              <ListItem>
                                <ListItemIcon>
                                  <Chip
                                    icon={displayInfo.icon}
                                    label={getEntityDisplayName(issue.entityType)}
                                    color={displayInfo.color}
                                    size="small"
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box>
                                      <Typography variant="subtitle2">
                                        {issue.entityType}: {issue.entityId}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        フィールド: {issue.field}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Typography variant="body2" color="error">
                                      {issue.description}
                                    </Typography>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Box display="flex" gap={1}>
                                    {issue.issueType === 'missing_in_db' && (
                                      <Tooltip title="詳細デバッグ">
                                        <IconButton
                                          size="small"
                                          color="info"
                                          onClick={() => handleDebugIssue(issue)}
                                        >
                                          <AssessmentIcon />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title={
                                      issue.issueType === 'missing_in_db' 
                                        ? '孤立ファイルを削除' 
                                        : 'DB参照を削除'
                                    }>
                                      <IconButton
                                        edge="end"
                                        color="primary"
                                        onClick={() => handleFixIssue(issue)}
                                        disabled={fixingIssues.has(issue.id)}
                                      >
                                        {issue.issueType === 'missing_in_db' ? <DeleteIcon /> : <RemoveCircleIcon />}
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < issuesOfType.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StorageIntegrityChecker;
