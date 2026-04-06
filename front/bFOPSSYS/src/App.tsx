import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Drawer, List, ListItemText, 
  CssBaseline, Box, ThemeProvider, createTheme, ListItemIcon, Button
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import './App.css';

// --- Icons ---
import GridViewIcon from '@mui/icons-material/GridView';
import BusinessIcon from '@mui/icons-material/Business';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';

import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import PersonsPage from './pages/PersonsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import OrganizationPage from './pages/OrganizationPage.tsx';
import UniteStatsDetailPageWrapper from './pages/UniteStatsDetailPageWrapper';
import UniteStatsDetailByStatusPage from './pages/UniteStatsDetailByStatusPage';
import TransferPage from './pages/TransferPage';
import GainLossPage from './pages/GainLossPage';
import { I18nProvider, useI18n } from './i18n/translator';

const drawerWidth = 300; // Widened slightly to match the design

const navItems = [
  { label: 'Dashboard', path: '/', icon: <GridViewIcon /> },
  { label: 'Settings', path: '/organization', icon: <BusinessIcon /> },
  { label: 'Jobs', path: '/jobs', icon: <WorkOutlineIcon /> },
  { label: 'Persons', path: '/persons', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Assignments', path: '/assignments', icon: <AssignmentOutlinedIcon /> },
  { label: 'Worker Transfer', path: '/transfer', icon: <SwapHorizIcon /> },
  { label: 'Gain/Loss Tracker', path: '/gain-loss', icon: <TrendingUpIcon /> },
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

// We separate the layout into its own component so we can use the `useLocation` hook
function AppLayout() {
  const location = useLocation();
  const { language, toggleLanguage, t } = useI18n();
  const activeLabel = navItems.find(item => item.path === location.pathname)?.label
    || ((location.pathname === '/companies' || location.pathname === '/unites/create' || location.pathname === '/grades/create' || location.pathname === '/years' || location.pathname === '/quota-management') ? 'Settings' : '');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${drawerWidth}px minmax(0, 1fr)`,
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <CssBaseline />
      
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
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
                  sx={{ 
                    mb: 0.5,
                    py: 1.2,
                    pl: 3,
                    borderLeft: isActive ? '4px solid' : '4px solid transparent',
                    borderColor: isActive ? 'primary.main' : 'transparent',
                    backgroundColor: isActive ? 'rgba(49, 78, 231, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(49, 78, 231, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40, 
                    color: isActive ? 'primary.main' : '#64748B' 
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

        {/* Bottom Actions (Support & Logout) */}
        <Box sx={{ pb: 3 }}>
          <List>
            <ListItemButton sx={{ pl: 3, py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText 
                primary={t('Support')} 
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }} 
              />
            </ListItemButton>
            <ListItemButton sx={{ pl: 3, py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary={t('Logout')} 
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }} 
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      
      {/* Main Content Area */}
      <Box component="main" sx={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, minHeight: '100vh', overflowX: 'hidden' }}>
        
        {/* Subtle Top Bar (Replacing the heavy blue AppBar) */}
        <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'transparent', color: 'text.primary', borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
          <Toolbar sx={{ justifyContent: 'space-between', width: '100%', px: { xs: 2, sm: 3, md: 4 }, boxSizing: 'border-box', flexWrap: 'wrap', rowGap: 1.25 }}>
            {/* The page title can dynamically populate here later, or leave it blank as a spacer to match design */}
            <Typography variant="h6" fontWeight="bold">
              {t(activeLabel)}
            </Typography>
            {/* Placeholder for your Search Bar and Profile Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Button size="small" variant="outlined" onClick={toggleLanguage}>
                {language === 'en' ? 'AR' : 'EN'}
              </Button>
              {/* Fake elements to match your screenshot layout */}
              <Typography variant="body2" color="text.secondary">{t('Search...')}</Typography>
              <Box sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', borderRadius: '50%' }} />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content Routes */}
        <Box sx={{ flexGrow: 1, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/companies" element={<Navigate to="/organization?tab=companies" replace />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/years" element={<Navigate to="/organization?tab=years" replace />} />
            <Route path="/persons" element={<PersonsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/unites/create" element={<Navigate to="/organization?tab=unites" replace />} />
            <Route path="/grades/create" element={<Navigate to="/organization?tab=grades" replace />} />
            <Route path="/quota-management" element={<Navigate to="/organization?tab=quotas" replace />} />
            <Route path="/unite-stats/:uniteId/:yearId" element={<UniteStatsDetailPageWrapper />} />
            <Route path="/unite-stats-detail-by-status/:status/:year" element={<UniteStatsDetailByStatusPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/gain-loss" element={<GainLossPage />} />
          </Routes>
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
          <AppLayout />
        </Router>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;