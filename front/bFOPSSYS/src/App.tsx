import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, Outlet } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Drawer, List, ListItemText, 
  CssBaseline, Box, ThemeProvider, createTheme, ListItemIcon, Button, IconButton,
  useMediaQuery, useTheme
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import './App.css';

// --- Icons ---
import GridViewIcon from '@mui/icons-material/GridView';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MenuIcon from '@mui/icons-material/Menu';
import settingsSvg from './assets/settings-svgrepo-com.svg';

import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import PersonsPage from './pages/PersonsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import OrganizationPage from './pages/OrganizationPage';
import UniteStatsDetailPageWrapper from './pages/UniteStatsDetailPageWrapper';
import UniteStatsDetailByStatusPage from './pages/UniteStatsDetailByStatusPage';
import TransferPage from './pages/TransferPage';
import GainLossPage from './pages/GainLossPage';
import LoginPage from './pages/LoginPage';
import UsersManagementPage from './pages/UsersManagementPage';
import { I18nProvider, useI18n } from './i18n/translator';
import { useAuth } from './context/AuthContext';

const drawerWidth = 300; // Widened slightly to match the design

const navItemsOriginal = [
  { label: 'Dashboard', path: '/', icon: <GridViewIcon /> },
  { label: 'Jobs', path: '/jobs', icon: <WorkOutlineIcon />, adminOnly: true },
  { label: 'Persons', path: '/persons', icon: <PeopleAltOutlinedIcon />, adminOnly: true },
  { label: 'Assignments', path: '/assignments', icon: <AssignmentOutlinedIcon />, adminOnly: true },
  { label: 'Worker Transfer', path: '/transfer', icon: <SwapHorizIcon />, adminOnly: true },
  { label: 'Gain/Loss Tracker', path: '/gain-loss', icon: <TrendingUpIcon />, adminOnly: true },
  { label: 'Users Management', path: '/users', icon: <ManageAccountsIcon />, adminOnly: true },
];

const theme = createTheme({
  palette: {
    background: { default: '#f4f6f8' },
    primary: { main: '#314EE7' }, // Adjusted to match the deep blue from your screenshot
    text: { primary: '#1E293B', secondary: '#64748B' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
});

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin }: { children: ReactElement, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// We separate the layout into its own component so we can use the `useLocation` hook
function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useI18n();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const roleLabel = user?.role === 'admin' ? t('Admin') : t('Guest');

  const navItems = navItemsOriginal.filter(item => !item.adminOnly || user?.role === 'admin');

  const activeLabel = navItems.find(item => item.path === location.pathname)?.label
    || ((location.pathname === '/companies' || location.pathname === '/unites/create' || location.pathname === '/grades/create' || location.pathname === '/years' || location.pathname === '/quota-management') ? 'Settings' : '');

  const handleOpenMobileDrawer = () => setMobileDrawerOpen(true);
  const handleCloseMobileDrawer = () => setMobileDrawerOpen(false);

  const drawerContent = (
    <>
      {/* Top Branding Area */}
      <Box sx={{ p: 3, pb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
          BFops HR
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>
          EDITORIAL WORKSPACE
        </Typography>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1 }}>
        <List sx={{ px: 0 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.label}
                component={Link}
                to={item.path}
                onClick={handleCloseMobileDrawer}
                sx={{
                  mb: 0.5,
                  py: 1.2,
                  pl: 3,
                  borderLeft: isActive ? '4px solid' : '4px solid transparent',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  backgroundColor: isActive ? 'rgba(49, 78, 231, 0.04)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(49, 78, 231, 0.08)',
                    '& svg': {
                      transform: 'rotate(360deg)'
                    }
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: isActive ? 'primary.main' : '#64748B',
                  '& svg': {
                    transition: 'transform 0.5s ease-in-out'
                  }
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={t(item.label)}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'primary.main' : '#64748B'
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Bottom Actions (Settings & Logout) */}
      <Box sx={{ pb: 3 }}>
        <List>
          {user?.role === 'admin' && (
            <ListItemButton 
              component={Link} 
              to="/organization" 
              sx={{ 
                pl: 3, 
                py: 1.2,
                '&:hover .settings-icon': {
                  transform: 'rotate(360deg)'
                }
              }} 
              onClick={handleCloseMobileDrawer}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                <Box
                  component="img"
                  className="settings-icon"
                  src={settingsSvg}
                  alt="Settings"
                  sx={{
                    width: 24,
                    height: 24,
                    opacity: 0.8, // Make it look closer to MUI primary icons
                    transition: 'transform 0.5s ease-in-out'
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={t('Settings')}
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }}
              />
            </ListItemButton>
          )}
          <ListItemButton
            sx={{
              pl: 3,
              py: 1.2,
              '&:hover svg': {
                transform: 'rotate(360deg)',
              }
            }}
            onClick={() => {
              handleCloseMobileDrawer();
              logout();
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: '#64748B',
              '& svg': {
                transition: 'transform 0.5s ease-in-out'
              }
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('Logout')}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }}
            />
          </ListItemButton>
        </List>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `${drawerWidth}px minmax(0, 1fr)` },
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <CssBaseline />
      
      {/* Desktop Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: 'none',
            position: 'relative',
            height: '100vh',
            overflow: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleCloseMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main Content Area */}
      <Box component="main" sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, minHeight: '100vh', overflowX: 'hidden' }}>
        
        {/* Subtle Top Bar (Replacing the heavy blue AppBar) */}
        <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'transparent', color: 'text.primary', borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
          <Toolbar sx={{ justifyContent: 'space-between', width: '100%', px: { xs: 2, sm: 3, md: 4 }, boxSizing: 'border-box', flexWrap: 'wrap', rowGap: 1.25 }}>
            {/* The page title can dynamically populate here later, or leave it blank as a spacer to match design */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              {isMobile && (
                <IconButton aria-label="open navigation" onClick={handleOpenMobileDrawer} size="small">
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" fontWeight="bold" noWrap>
                {t(activeLabel)}
              </Typography>
            </Box>
            {/* Placeholder for your Search Bar and Profile Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: { xs: 170, sm: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user ? `${user.username} (${roleLabel})` : 'User'}
              </Typography>
              <Button size="small" variant="outlined" onClick={toggleLanguage}>
                {language === 'en' ? 'AR' : 'EN'}
              </Button>
              {/* Fake elements to match your screenshot layout */}
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{t('Search...')}</Typography>
              <Box sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', borderRadius: '50%', display: { xs: 'none', sm: 'block' } }} />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content Routes */}
        <Box sx={{ flexGrow: 1, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <I18nProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="organization" element={<ProtectedRoute requireAdmin><OrganizationPage /></ProtectedRoute>} />
              <Route path="companies" element={<ProtectedRoute requireAdmin><Navigate to="/organization?tab=companies" replace /></ProtectedRoute>} />
              <Route path="jobs" element={<ProtectedRoute requireAdmin><JobsPage /></ProtectedRoute>} />
              <Route path="years" element={<ProtectedRoute requireAdmin><Navigate to="/organization?tab=years" replace /></ProtectedRoute>} />
              <Route path="persons" element={<ProtectedRoute requireAdmin><PersonsPage /></ProtectedRoute>} />
              <Route path="assignments" element={<ProtectedRoute requireAdmin><AssignmentsPage /></ProtectedRoute>} />
              <Route path="unites/create" element={<ProtectedRoute requireAdmin><Navigate to="/organization?tab=unites" replace /></ProtectedRoute>} />
              <Route path="grades/create" element={<ProtectedRoute requireAdmin><Navigate to="/organization?tab=grades" replace /></ProtectedRoute>} />
              <Route path="quota-management" element={<ProtectedRoute requireAdmin><Navigate to="/organization?tab=quotas" replace /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute requireAdmin><UsersManagementPage /></ProtectedRoute>} />
              <Route path="unite-stats/:uniteId/:yearId" element={<ProtectedRoute requireAdmin><UniteStatsDetailPageWrapper /></ProtectedRoute>} />
              <Route path="unite-stats-detail-by-status/:status" element={<ProtectedRoute requireAdmin><UniteStatsDetailByStatusPage /></ProtectedRoute>} />
              <Route path="transfer" element={<ProtectedRoute requireAdmin><TransferPage /></ProtectedRoute>} />
              <Route path="gain-loss" element={<ProtectedRoute requireAdmin><GainLossPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </Router>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;