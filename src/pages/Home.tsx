import React from 'react';
import { Box, Container, IconButton, Slide, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import Calendar from '../components/Calendar';
import TransactionMenu from '../components/TransactionMenu';
import TransactionForm from '../components/TransactionForm';
import TransactionDetails from '../components/TransactionDetails';
import { useTransactions } from '../contexts/TransactionContext';

const Home: React.FC = () => {
  const { showTransactionForm, setShowTransactionForm, selectedDate, setSelectedDate, isDateClicked, setIsDateClicked } = useTransactions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Container maxWidth="xl" sx={{ py: 2, position: 'relative' }}>
      {/* 背景オーバーレイ（小さな画面のみ） */}
      {showTransactionForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998, // フォームより少し下
            display: { xs: 'block', lg: 'none' }
          }}
          onClick={() => setShowTransactionForm(false)}
        />
      )}

      {/* 取引入力フォーム（レスポンシブオーバーレイ） */}
      {showTransactionForm && (
        <Box 
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-form-title"
          sx={{ 
            position: { xs: 'fixed', lg: 'absolute' },
            // 小さな画面: 画面中央にモーダル表示
            // デスクトップ: 月間サマリーの上にオーバーレイ
            top: { xs: '50%', sm: 'calc(50% + 32px)', md: '50%', lg: 10 },
            left: { xs: '50%', md: '50%', lg: 'auto' },
            right: { xs: 'auto', md: 'auto', lg: 520 },
            transform: { xs: 'translate(-50%, -50%)', md: 'translate(-50%, -50%)', lg: 'none' },
            width: { xs: 'calc(100vw - 32px)', sm: '80vw', md: 400, lg: 320 },
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 350, lg: 'none' },
            maxHeight: { xs: 'calc(100vh - 64px)', lg: 'none' },
            overflow: { xs: 'hidden', lg: 'visible' },
            zIndex: 9999, // 常に最上位に表示
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            // モバイルでのスクロール対応
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 閉じるボタン（モバイル対応） */}
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 1401,
            backgroundColor: 'white',
            borderRadius: '8px 8px 0 0',
            display: { xs: 'flex', lg: 'block' },
            justifyContent: { xs: 'flex-end', lg: 'unset' },
            p: { xs: 1, lg: 0 },
            borderBottom: { xs: '1px solid #e0e0e0', lg: 'none' }
          }}>
            <IconButton
              onClick={() => setShowTransactionForm(false)}
              sx={{
                position: { xs: 'static', lg: 'absolute' },
                top: { xs: 'auto', lg: -8 },
                right: { xs: 'auto', lg: -8 },
                zIndex: 10000, // フォームより上に
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)'
                }
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
          
          {/* フォーム本体（スクロール可能） */}
          <Box sx={{ 
            flex: 1, 
            overflow: { xs: 'auto', lg: 'visible' },
            p: { xs: 0, lg: 0 }
          }}>
            <TransactionForm />
          </Box>
        </Box>
      )}

      {/* モバイル：日付選択時のスライド表示エリア */}
      {isMobile && selectedDate && isDateClicked && (
        <Slide direction="down" in={!!(selectedDate && isDateClicked)} mountOnEnter unmountOnExit>
          <Box 
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              zIndex: 1200,
              maxHeight: '60vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              borderRadius: '0 0 24px 24px'
            }}
          >
            {/* 閉じるボタン */}
            <Box sx={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'white', 
              zIndex: 1, 
              p: 1, 
              borderBottom: '1px solid #e0e0e0',
              borderRadius: '0 0 0 0' 
            }}>
              <IconButton
                onClick={() => {
                  setSelectedDate(null);
                  setIsDateClicked(false);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
            <Box sx={{ p: 2 }}>
              <TransactionMenu />
              <TransactionDetails />
            </Box>
          </Box>
        </Slide>
      )}

      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', lg: 'row' }}
        gap={3}
        sx={{ 
          // モバイルでスライドが表示されている時は上にマージンを追加
          marginTop: isMobile && selectedDate && isDateClicked ? '60vh' : 0,
          transition: 'margin-top 0.3s ease-in-out'
        }}
      >
        {/* カレンダー（左側） */}
        <Box 
          flex={{ lg: 2 }} 
          sx={{ minWidth: 0 }}
        >
          <Calendar />
        </Box>
        
        {/* 右側コンテンツ（デスクトップのみ） */}
        <Box 
          flex={{ lg: 1 }} 
          sx={{ 
            minWidth: 0,
            display: { xs: 'none', lg: 'block' }  // モバイルでは非表示
          }}
        >
          <TransactionMenu />
          <TransactionDetails />
        </Box>
      </Box>
    </Container>
  );
};

export default Home;