import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCategories } from '../../contexts/CategoryContext';

interface SideBarProps {
  drawerWidth: number;
  mobileOpen?: boolean;
  handleDrawerClose?: () => void;
  handleDrawerTransitionEnd?: () => void;
  handleDrawerToggle?: () => void;
  isMobile?: boolean;
}

// ナビゲーション項目の定義
const navigationItems = [
  { text: 'ホーム', icon: <HomeIcon />, path: '/' },
  { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'レポート', icon: <AssessmentIcon />, path: '/report' },
];

// 現場管理メニュー
const siteManagementItems = [
  { text: '現場管理', icon: <BusinessIcon />, path: '/site-management' },
  { text: 'カテゴリー管理', icon: <CategoryIcon />, path: '/category-management' },
];

const settingsItems = [
  { text: 'プロフィール', icon: <PersonIcon />, path: '/profile' },
  { text: '設定', icon: <SettingsIcon />, path: '/settings' },
  { text: 'ヘルプ', icon: <HelpIcon />, path: '/help' },
];

const SideBar: React.FC<SideBarProps> = ({
  drawerWidth,
  isMobile = false,
}) => {
  // NavLinkのスタイル関数
  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    width: '100%',
  });

  // 取引データから支出TOP10を計算
  const { setSelectedDate, siteExpenses } = useTransactions();
  const { categories } = useCategories();
  // 表示モードと抽出月の状態
  const [viewMode, setViewMode] = React.useState<'date'|'detail'>('date');
  const [selectedMonth, setSelectedMonth] = React.useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);

  // TOP10データの計算
  const topExpenses = React.useMemo(() => {
    if (!siteExpenses) return [] as any[];
    const [year, month] = selectedMonth.split('-').map((n) => parseInt(n, 10));
    const monthTx = siteExpenses.filter((t) => t.date && t.date.startsWith(`${year}-${String(month).padStart(2,'0')}`));
    if (viewMode === 'date') {
      const byDate = new Map<string, number>();
      monthTx.forEach((t) => {
        byDate.set(t.date, (byDate.get(t.date) ?? 0) + t.amount);
      });
      return Array.from(byDate.entries()).sort((a,b)=> b[1]-a[1]).slice(0,10).map(([date, amount]) => ({ date, amount }));
    } else {
      return monthTx.slice().sort((a,b)=> b.amount - a.amount).slice(0,10);
    }
  }, [siteExpenses, selectedMonth, viewMode]);

  const formatDate = (d: string) => d.replace(/-/g, '/');

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          実行予算管理システム
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* メインナビゲーション */}
      <List>
        {navigationItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <NavLink
              to={item.path}
              style={navLinkStyle}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 235, 238, 0.8)', // とても薄い赤色
                      '& .MuiListItemIcon-root': {
                        color: '#d32f2f', // 薄い赤色
                      },
                      '& .MuiListItemText-primary': {
                        color: '#d32f2f', // 薄い赤色
                        fontWeight: 'bold',
                      },
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              )}
            </NavLink>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* 現場管理メニュー */}
      <List>
        <ListItem>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            現場管理
          </Typography>
        </ListItem>
        {siteManagementItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <NavLink
              to={item.path}
              style={navLinkStyle}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 235, 238, 0.8)', // とても薄い赤色
                      '& .MuiListItemIcon-root': {
                        color: '#d32f2f', // 薄い赤色
                      },
                      '& .MuiListItemText-primary': {
                        color: '#d32f2f', // 薄い赤色
                        fontWeight: 'bold',
                      },
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              )}
            </NavLink>
          </ListItem>
        ))}
      </List>
      {/* TOP10セクション - カード風デザイン & 月選択・モード切替 */}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_e, v) => { if (v) setViewMode(v); }}
            size="small"
          >
            <ToggleButton value="date">日付TOP</ToggleButton>
            <ToggleButton value="detail">詳細TOP</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="抽出月"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ width: '100%', display: 'block' }}>
          {(topExpenses.length > 0 ? topExpenses : new Array(0)).map((item: any, idx: number) => {
            const amount = (item as any).amount;
            const datePart = (item as any).date ?? '';
            const content = (item as any).content ?? '';
            const categoryId = (item as any).categoryId ?? '';
            // カテゴリー名を取得
            const category = categories.find(c => c.id === categoryId);
            const categoryName = category?.name || '不明なカテゴリー';
            
            // 第一行: 日付, 第二行: 金額, 第三行: 詳細(ディスプレイは日付or詳細モードに応じて切替)
            const firstLine = viewMode === 'date' ? formatDate(datePart) : formatDate(datePart);
            const secondLine = `¥${amount.toLocaleString()}`;
            const thirdLine = viewMode === 'detail' ? `[${categoryName}] ${String(content).slice(0, 25)}` : '';
            // クリック時に取引日を設定する
            const handleClick = () => {
              if (viewMode === 'date' && datePart && setSelectedDate) {
                const year = parseInt(datePart.substring(0, 4), 10);
                const month = parseInt(datePart.substring(5, 7), 10) - 1; // 0-based
                const day = parseInt(datePart.substring(8, 10), 10);
                const dt = new Date(year, month, day);
                setSelectedDate(dt);
              }
            };
            return (
              <Box key={idx} sx={{ width: '100%', mb: 2 }}>
                <Card variant="outlined" sx={{ height: 'auto', cursor: 'pointer' }} onClick={handleClick}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">{firstLine}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{secondLine}</Typography>
                    {thirdLine && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {thirdLine}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      {/* 設定・その他 */}
      <List>
        {settingsItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <NavLink
              to={item.path}
              style={navLinkStyle}
            >
              {({ isActive }) => (
                <ListItemButton
                  selected={isActive}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 235, 238, 0.8)', // とても薄い赤色
                      '& .MuiListItemIcon-root': {
                        color: '#d32f2f', // 薄い赤色
                      },
                      '& .MuiListItemText-primary': {
                        color: '#d32f2f', // 薄い赤色
                        fontWeight: 'bold',
                      },
                    },
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              )}
            </NavLink>
          </ListItem>
        ))}
      </List>
    </div>
  );

  // モバイル版の場合は、drawerの内容のみを返す
  if (isMobile) {
    return <>{drawer}</>;
  }

  // デスクトップ版の場合は、Drawerでラップして返す
  return (
    <Box
      component="nav"
      sx={{ width: drawerWidth, flexShrink: 0 }}
      aria-label="navigation"
    >
      {/* デスクトップ用の永続サイドバー - 900px以上でのみ表示 */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            position: 'fixed',
            height: '100vh',
            top: 0,
            left: 0,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default SideBar;