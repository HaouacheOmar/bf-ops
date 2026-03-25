import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Drawer, List, ListItemText, 
  CssBaseline, Box, Container, ThemeProvider, createTheme, ListItemIcon, Divider
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import './App.css';

// --- Icons ---
import GridViewIcon from '@mui/icons-material/GridView';
import BusinessIcon from '@mui/icons-material/Business';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';

// --- Page Imports ---
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import StatsPage from './pages/StatsPage';
import JobsPage from './pages/JobsPage';
import YearsPage from './pages/YearsPage';
import PersonsPage from './pages/PersonsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import UniteCreatePage from './pages/UniteCreatePage';
import GradeCreatePage from './pages/GradeCreatePage';
import QuotaManagementPage from './pages/QuotaManagementPage';
import UniteStatsDetailPageWrapper from './pages/UniteStatsDetailPageWrapper';
import UniteStatsDetailByStatusPage from './pages/UniteStatsDetailByStatusPage';
import TransferPage from './pages/TransferPage';
import GainLossPage from './pages/GainLossPage';

const drawerWidth = 260; // Widened slightly to match the design

const navItems = [
  { label: 'Dashboard', path: '/', icon: <GridViewIcon /> },
  { label: 'Companies', path: '/companies', icon: <BusinessIcon /> },
  { label: 'Jobs', path: '/jobs', icon: <WorkOutlineIcon /> },
  { label: 'Years', path: '/years', icon: <CalendarTodayIcon /> },
  { label: 'Persons', path: '/persons', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Assignments', path: '/assignments', icon: <AssignmentOutlinedIcon /> },
  { label: 'Statistics', path: '/stats', icon: <InsertChartOutlinedIcon /> },
  
  // Secondary / Admin items
  { label: 'Create Unite', path: '/unites/create', icon: <AddBusinessOutlinedIcon /> },
  { label: 'Create Grade', path: '/grades/create', icon: <StarsOutlinedIcon /> },
  { label: 'Quota Management', path: '/quota-management', icon: <PieChartOutlineIcon /> },
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0', // Soft gray border
            display: 'flex',
            flexDirection: 'column'
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
                    primary={item.label} 
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
                primary="Support" 
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }} 
              />
            </ListItemButton>
            <ListItemButton sx={{ pl: 3, py: 1.2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748B' }} 
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
      
      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Subtle Top Bar (Replacing the heavy blue AppBar) */}
        <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'transparent', color: 'text.primary', borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* The page title can dynamically populate here later, or leave it blank as a spacer to match design */}
            <Typography variant="h6" fontWeight="bold">
              {navItems.find(item => item.path === location.pathname)?.label || ''}
            </Typography>
            {/* Placeholder for your Search Bar and Profile Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Fake elements to match your screenshot layout */}
              <Typography variant="body2" color="text.secondary">Search...</Typography>
              <Box sx={{ width: 32, height: 32, bgcolor: '#e2e8f0', borderRadius: '50%' }} />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content Routes */}
        <Box sx={{ p: 4, flexGrow: 1, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/years" element={<YearsPage />} />
            <Route path="/persons" element={<PersonsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/unites/create" element={<UniteCreatePage />} />
            <Route path="/grades/create" element={<GradeCreatePage />} />
            <Route path="/quota-management" element={<QuotaManagementPage />} />
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
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;