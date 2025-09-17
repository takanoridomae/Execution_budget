import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import NoMatch from './pages/NoMatch';
import AppLayout from './components/AppLayout';
import SiteManagement from './components/SiteManagement';
import CategoryManagement from './components/CategoryManagement';
import { theme } from './theme/theme';
import { TransactionProvider } from './contexts/TransactionContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { SiteProvider } from './contexts/SiteContext';
import { CategoryProvider } from './contexts/CategoryContext';

function App() {
  return (
    <SiteProvider>
      <CategoryProvider>
        <TransactionProvider>
          <BudgetProvider>
            <BrowserRouter>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="report" element={<Report />} />
                    <Route path="site-management" element={<SiteManagement />} />
                    <Route path="category-management" element={<CategoryManagement />} />
                    <Route path="*" element={<NoMatch />} />
                  </Route>
                </Routes>
              </ThemeProvider>
            </BrowserRouter>
          </BudgetProvider>
        </TransactionProvider>
      </CategoryProvider>
    </SiteProvider>
  );
}

export default App;
