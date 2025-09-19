import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: SvgIconComponent;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  formatAsNumber?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  formatAsNumber = false
}) => {
  const displayValue = formatAsNumber && typeof value === 'number' 
    ? `¥${value.toLocaleString()}`
    : value;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Icon color={color} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="h3" color={`${color}.main`}>
          {displayValue}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;
