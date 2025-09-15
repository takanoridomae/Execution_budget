import React, { useState } from 'react';
import { 
  FormControl, 
  InputLabel, 
  FormHelperText, 
  useMediaQuery, 
  useTheme,
  TextField,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  InputAdornment,
  IconButton
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { getCategoriesByType } from '../../constants/categories';
import { IncomeCategory, ExpenseCategory } from '../../types';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  transactionType: 'income' | 'expense';
  error?: boolean;
  helperText?: string;
  label?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  transactionType,
  error = false,
  helperText,
  label = 'カテゴリー',
  size = 'medium',
  fullWidth = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const categories = getCategoriesByType(transactionType);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  // デバッグ用ログ（後で削除）
  console.log('CategorySelect render:', {
    value,
    transactionType,
    categoriesCount: categories.length,
    categories: categories.slice(0, 3), // 最初の3件だけ
    isMobile
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    handleClose();
    // 選択後に適切にフォーカスを戻す
    setTimeout(() => {
      const nextInput = document.querySelector('textarea[placeholder], input[type="text"]:not([readonly])') as HTMLElement;
      if (nextInput) {
        nextInput.focus();
      }
    }, 100);
  };

  const open = Boolean(anchorEl);
  // 型安全な検索のため、明示的にキャストしてから検索
  const categoryList: Array<{ value: string; label: string }> = categories as Array<{ value: string; label: string }>;
  const selectedCategory = categoryList.find((cat) => cat.value === value);
  const displayValue = selectedCategory ? selectedCategory.label : '';

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        fullWidth={fullWidth}
        size={size}
        label={label}
        value={displayValue}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        placeholder="カテゴリーを選択してください"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleClick} edge="end">
                <ExpandMore />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          cursor: 'pointer',
          '& .MuiInputBase-input': {
            cursor: 'pointer'
          }
        }}
      />
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isMobile ? 'center' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isMobile ? 'center' : 'left',
        }}
        style={{ zIndex: 2500 }}
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: isMobile ? 'calc(100vw - 32px)' : anchorEl?.offsetWidth || 280,
            maxWidth: isMobile ? 280 : 400,
            // 確実に前面に表示するためのz-index
            zIndex: 2500,
            // 視覚的に分かりやすくするための背景とボーダー
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            // モバイルで中央に配置
            ...(isMobile && {
              left: '50% !important',
              marginLeft: '-140px !important',
            })
          }
        }}
        disablePortal={true}
      >
        <List dense>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleSelect('')}
              selected={value === ''}
              sx={{
                backgroundColor: value === '' ? '#e3f2fd' : 'transparent',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            >
              <ListItemText 
                primary={<em>カテゴリーを選択してください</em>}
                sx={{ color: 'text.secondary' }}
              />
            </ListItemButton>
          </ListItem>
          {categories.map((category) => (
            <ListItem key={category.value} disablePadding>
              <ListItemButton 
                onClick={() => handleSelect(category.value)}
                selected={value === category.value}
                sx={{
                  backgroundColor: value === category.value ? '#e3f2fd' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                <ListItemText primary={category.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>
    </Box>
  );
};

export default CategorySelect;
