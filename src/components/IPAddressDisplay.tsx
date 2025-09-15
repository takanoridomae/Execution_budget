import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Tooltip,
  Alert,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useIPAddress } from '../hooks/useIPAddress';

interface IPAddressDisplayProps {
  initialOpen?: boolean;
  compact?: boolean;
  showDebugInfo?: boolean;
}

export const IPAddressDisplay: React.FC<IPAddressDisplayProps> = ({ 
  initialOpen = false, 
  compact = false,
  showDebugInfo = false
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showDebugDetails, setShowDebugDetails] = useState(false);
  const { local, public: publicIP, loading, error } = useIPAddress();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // IPアドレスをクリップボードにコピー
  const copyToClipboard = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      // TODO: トースト通知を追加
      console.log(`IPアドレス ${ip} をコピーしました`);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗:', error);
    }
  };

  // IPアドレスを短縮表示
  const formatIP = (ip: string) => {
    if (showFullAddress || ip.length <= 15) return ip;
    return ip.replace(/(\d+\.\d+\.\d+)\.\d+/, '$1.***');
  };

  // コンパクト表示モード
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NetworkIcon color="primary" fontSize="small" />
        {loading ? (
          <CircularProgress size={16} />
        ) : local.length > 0 ? (
          <Chip
            label={formatIP(local[0])}
            size="small"
            variant="outlined"
            onClick={() => copyToClipboard(local[0])}
            icon={<CopyIcon fontSize="small" />}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            IP取得中...
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[3]
        }
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* ヘッダー */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NetworkIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary">
              ネットワーク情報
            </Typography>
            {loading && <CircularProgress size={16} />}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* クイック表示 */}
            {!loading && local.length > 0 && (
              <Chip
                label={formatIP(local[0])}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            
            <IconButton size="small">
              {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* 詳細表示 */}
        <Collapse in={isOpen}>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
                {error}
              </Alert>
            )}

            {/* プライバシー切り替え */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Tooltip title={showFullAddress ? "IPアドレスを隠す" : "完全なIPアドレスを表示"}>
                <IconButton 
                  size="small" 
                  onClick={() => setShowFullAddress(!showFullAddress)}
                >
                  {showFullAddress ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* ローカルIPアドレス */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                ローカルIPアドレス:
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">取得中...</Typography>
                </Box>
              ) : local.length > 0 ? (
                <Box sx={{ mt: 0.5 }}>
                  {local.map((ip, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 0.5,
                        flexWrap: isMobile ? 'wrap' : 'nowrap'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            backgroundColor: index === 0 ? theme.palette.primary.light : theme.palette.grey[100],
                            color: index === 0 ? 'white' : 'inherit',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            border: index === 0 ? `2px solid ${theme.palette.primary.main}` : 'none'
                          }}
                        >
                          {formatIP(ip)}
                        </Typography>
                        {index === 0 && (
                          <Chip 
                            label="メイン" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.6rem', 
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {ip === '127.0.0.1' && (
                          <Chip 
                            label="ローカルホスト" 
                            size="small" 
                            color="default" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.6rem', 
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                      <Tooltip title="コピー">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(ip)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ mt: 0.5 }}>
                  <Alert severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                    ローカルIPアドレスを取得できませんでした
                  </Alert>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    以下をお試しください：
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, fontSize: '0.8rem' }}>
                    <li>ブラウザの設定でWebRTCが有効になっているか確認</li>
                    <li>ネットワーク接続を確認</li>
                    <li>ファイアウォールの設定を確認</li>
                    <li>シークレットモードではない通常のブラウザタブで開く</li>
                  </Box>
                  {showDebugInfo && (
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setShowDebugDetails(!showDebugDetails)}
                      >
                        デバッグ情報を{showDebugDetails ? '隠す' : '表示'}
                      </Typography>
                      <Collapse in={showDebugDetails}>
                        <Box sx={{ mt: 1, p: 1, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                          <Typography variant="caption" component="div">
                            ブラウザ: {navigator.userAgent}
                          </Typography>
                          <Typography variant="caption" component="div">
                            WebRTC対応: {window.RTCPeerConnection ? 'はい' : 'いいえ'}
                          </Typography>
                          <Typography variant="caption" component="div">
                            HTTPS: {window.location.protocol === 'https:' ? 'はい' : 'いいえ'}
                          </Typography>
                          <Typography variant="caption" component="div">
                            ネットワーク情報: {(navigator as any).connection ? 'あり' : 'なし'}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* パブリックIPアドレス */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                パブリックIPアドレス:
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">取得中...</Typography>
                </Box>
              ) : publicIP ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mt: 0.5,
                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      backgroundColor: theme.palette.grey[100],
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                  >
                    {formatIP(publicIP)}
                  </Typography>
                  <Tooltip title="コピー">
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(publicIP)}
                      sx={{ ml: 'auto' }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  取得できませんでした
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default IPAddressDisplay;
