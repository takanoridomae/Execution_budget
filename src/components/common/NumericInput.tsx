import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Typography, TextFieldProps } from '@mui/material';
import { formatStringAsNumber, isValidNumber, parseCommaSeparatedNumber } from '../../utils/numberUtils';

/**
 * NumericInputコンポーネントのプロパティ
 */
interface NumericInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  /** 数値（文字列形式） */
  value: string;
  /** 値変更時のコールバック */
  onChange: (value: string) => void;
  /** 円マーク（¥）を表示するか（デフォルト: true） */
  showCurrencySymbol?: boolean;
  /** 最大値制限（デフォルト: なし） */
  maxValue?: number;
}

/**
 * IME制御付き数値入力コンポーネント
 * 
 * 機能:
 * - IME自動無効化（半角入力強制）
 * - 3桁区切り（カンマ）表示
 * - 数値のみ入力許可
 * - 円マーク表示オプション
 */
const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  showCurrencySymbol = true,
  maxValue,
  ...textFieldProps
}) => {
  // 内部表示用の状態（フォーマット済み）
  const [displayValue, setDisplayValue] = useState('');
  
  // 外部のvalueが変更された時に表示値を更新
  useEffect(() => {
    const formatted = value ? formatStringAsNumber(value) : '';
    setDisplayValue(formatted);
  }, [value]);

  /**
   * 入力値変更ハンドラー（メモ化で最適化）
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // カンマを除去して数値のみを取得
    const cleanValue = inputValue.replace(/,/g, '');
    
    // 数値として有効かチェック
    if (isValidNumber(cleanValue)) {
      // 最大値チェック
      if (maxValue && cleanValue !== '') {
        const numValue = Number(cleanValue);
        if (numValue > maxValue) {
          return; // 最大値を超える場合は更新しない
        }
      }
      
      // 即座に表示値を更新（カーソル位置保持）
      const formatted = cleanValue ? formatStringAsNumber(cleanValue) : '';
      setDisplayValue(formatted);
      
      // 親コンポーネントに清潔な値を送信
      onChange(cleanValue);
    }
  }, [maxValue, onChange]);

  /**
   * フォーカス時のIME制御
   */
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // IMEを無効化してアルファベット・数字モードに強制
    const target = event.target as HTMLInputElement;
    target.setAttribute('style', 'ime-mode: disabled;');
    
    // 元のonFocusイベントがあれば実行
    if (textFieldProps.onFocus) {
      textFieldProps.onFocus(event);
    }
  };

  /**
   * 日本語入力開始時のブロック
   */
  const handleCompositionStart = (event: React.CompositionEvent<HTMLInputElement>) => {
    // 日本語入力開始時に入力をブロック
    event.preventDefault();
    
    // 元のonCompositionStartイベントがあれば実行
    if (textFieldProps.onCompositionStart) {
      textFieldProps.onCompositionStart(event);
    }
  };

  // デバッグログ（パフォーマンス向上のため一時的に無効化）
  // console.log('🔢 NumericInput レンダリング', {
  //   inputValue: value,
  //   displayValue: displayValue,
  //   label: textFieldProps.label
  // });

  return (
    <TextField
      {...textFieldProps}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onCompositionStart={handleCompositionStart}
      inputMode="numeric"
      autoComplete="off"
      InputProps={{
        ...textFieldProps.InputProps,
        startAdornment: showCurrencySymbol ? (
          <Typography sx={{ mr: 1 }}>¥</Typography>
        ) : textFieldProps.InputProps?.startAdornment,
        inputProps: {
          ...textFieldProps.InputProps?.inputProps,
          pattern: '[0-9,]*',
          inputMode: 'numeric',
          style: { 
            imeMode: 'disabled',
            ...textFieldProps.InputProps?.inputProps?.style
          } as React.CSSProperties
        }
      }}
    />
  );
};

export default NumericInput;
