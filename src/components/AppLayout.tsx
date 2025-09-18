import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import SideBar from './common/SideBar';
import IPAddressDisplay from './IPAddressDisplay';
import { useMediaQuery, useTheme } from '@mui/material';
import { useTransactions } from '../contexts/TransactionContext';

const drawerWidth = 240;

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // 900px以上
  const { showTransactionDetailsModal, selectedDate, isDateClicked } = useTransactions();
  
  // 取引明細カード表示中かどうか（日付クリック時のスライド表示）
  const isTransactionDetailCardOpen = selectedDate && isDateClicked && !isDesktop;
  
  // ヘッダーを非表示にする条件
  const shouldHideHeader = showTransactionDetailsModal || isTransactionDetailCardOpen;
  
  // デバッグ用ログ
  console.log('AppLayout - showTransactionDetailsModal:', showTransactionDetailsModal);
  console.log('AppLayout - isTransactionDetailCardOpen:', isTransactionDetailCardOpen);
  console.log('AppLayout - shouldHideHeader:', shouldHideHeader);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: (theme) => theme.palette.grey[100], minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* 取引明細表示時のヘッダー隠しスタイル */}
      {shouldHideHeader && (
        <style>{`
          .MuiAppBar-root {
            display: none !important;
          }
        `}</style>
      )}
      
      {/* ヘッダー（取引明細表示時のみ非表示） */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { xs: 0, md: isDesktop ? `${drawerWidth}px` : 0 },
          zIndex: shouldHideHeader ? -1 : (theme) => theme.zIndex.drawer + 1,
          // 取引明細表示時は完全に非表示
          display: shouldHideHeader ? 'none' : 'block',
          visibility: shouldHideHeader ? 'hidden' : 'visible',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            実行予算管理システム
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* サイドバー - 900px以上でのみ表示 */}
      {isDesktop && (
        <SideBar 
          drawerWidth={drawerWidth}
          mobileOpen={mobileOpen}
          handleDrawerClose={handleDrawerClose}
          handleDrawerTransitionEnd={handleDrawerTransitionEnd}
          handleDrawerToggle={handleDrawerToggle}
          isMobile={false}
        />
      )}
      
      {/* モバイル用ドロワー - 900px未満でのみ表示 */}
      {!isDesktop && (
        <Box
          component="nav"
          sx={{ width: { xs: 0, md: drawerWidth }, flexShrink: 0 }}
          aria-label="mobile navigation"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            <SideBar 
              drawerWidth={drawerWidth}
              mobileOpen={mobileOpen}
              handleDrawerClose={handleDrawerClose}
              handleDrawerTransitionEnd={handleDrawerTransitionEnd}
              handleDrawerToggle={handleDrawerToggle}
              isMobile={true}
            />
          </Drawer>
        </Box>
      )}
      
      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { 
            xs: '100%',
            md: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          // モバイルでのスクロール最適化
          overflowX: 'hidden',
          // Safe Area対応（iPhoneのノッチ等）
          paddingBottom: { xs: 'env(safe-area-inset-bottom)', md: 3 },
        }}
      >
        {/* ヘッダーのスペーサー（ヘッダー表示時のみ） */}
        {!shouldHideHeader && (
          <Toolbar />
        )}
        
        {/* IPアドレス表示（ホームページでのみ表示） */}
        {location.pathname === '/' && (
          <IPAddressDisplay initialOpen={false} compact={false} showDebugInfo={true} />
        )}
        
        <Outlet />
      </Box>
    </Box>
  );
}
