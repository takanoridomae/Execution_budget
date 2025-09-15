import { createTheme } from '@mui/material/styles';
import { blue, red, green } from '@mui/material/colors';

// Material-UIの型を拡張してカスタムパレットを追加
declare module '@mui/material/styles' {
  interface Palette {
    incomeColor: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
    expenseColor: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
    balanceColor: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
  }

  interface PaletteOptions {
    incomeColor?: {
      main: string;
      light: string;
      dark: string;
      contrastText?: string;
    };
    expenseColor?: {
      main: string;
      light: string;
      dark: string;
      contrastText?: string;
    };
    balanceColor?: {
      main: string;
      light: string;
      dark: string;
      contrastText?: string;
    };
  }
}

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,  // 900pxでサイドバー表示
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // iOS Safariでの拡大禁止
          touchAction: 'manipulation',
          // アドレスバーの高さ変動対応（新しいビューポート単位を優先）
          minHeight: ['100vh', '100dvh'],
        },
        // スクロールバーの調整
        '*': {
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
          },
        },
      },
    },
    // タッチ対応の改善
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Apple推奨の最小タッチターゲット
          touchAction: 'manipulation',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          touchAction: 'manipulation',
        },
      },
    },
    // タイポグラフィのレスポンシブ対応
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontSize: '1.8rem',
          '@media (min-width:600px)': {
            fontSize: '2.125rem',
          },
        },
        h2: {
          fontSize: '1.5rem',
          '@media (min-width:600px)': {
            fontSize: '1.875rem',
          },
        },
        h3: {
          fontSize: '1.3rem',
          '@media (min-width:600px)': {
            fontSize: '1.5rem',
          },
        },
        h4: {
          fontSize: '1.1rem',
          '@media (min-width:600px)': {
            fontSize: '1.25rem',
          },
        },
        h5: {
          fontSize: '1rem',
          '@media (min-width:600px)': {
            fontSize: '1.125rem',
          },
        },
        h6: {
          fontSize: '0.9rem',
          '@media (min-width:600px)': {
            fontSize: '1rem',
          },
        },
        subtitle1: {
          fontSize: '0.9rem',
          '@media (min-width:600px)': {
            fontSize: '1rem',
          },
        },
        subtitle2: {
          fontSize: '0.8rem',
          '@media (min-width:600px)': {
            fontSize: '0.875rem',
          },
        },
        body1: {
          fontSize: '0.875rem',
          '@media (min-width:600px)': {
            fontSize: '1rem',
          },
        },
        body2: {
          fontSize: '0.8rem',
          '@media (min-width:600px)': {
            fontSize: '0.875rem',
          },
        },
        button: {
          fontSize: '0.875rem',
          '@media (min-width:600px)': {
            fontSize: '1rem',
          },
        },
        caption: {
          fontSize: '0.7rem',
          '@media (min-width:600px)': {
            fontSize: '0.75rem',
          },
        },
        overline: {
          fontSize: '0.7rem',
          '@media (min-width:600px)': {
            fontSize: '0.75rem',
          },
        },
      },
    },
  },
  palette: {
    incomeColor: {
      main: blue[500],
      light: blue[100],
      dark: blue[700],
      contrastText: '#ffffff',
    },
    expenseColor: {
      main: red[500],
      light: red[100],
      dark: red[700],
      contrastText: '#ffffff',
    },
    balanceColor: {
      main: green[500],
      light: green[100],
      dark: green[700],
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Noto Sans JP, Roboto, sans-serif, "Arial", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", "Meiryo", "sans-serif"',
    // ヘッダー系
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
      lineHeight: 1.4,
    },
    // サブタイトル系
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 400,
    },
    // ボディテキスト系 - 読みやすさを重視
    body1: {
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 400,
      lineHeight: 1.4,
    },
    // ボタン・キャプション系
    button: {
      fontWeight: 500,
      textTransform: 'none' as const, // 大文字変換を無効化
    },
    caption: {
      fontWeight: 300,
      lineHeight: 1.2,
    },
    overline: {
      fontWeight: 400,
    },
  },
});