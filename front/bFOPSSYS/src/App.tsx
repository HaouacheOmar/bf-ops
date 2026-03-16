import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItemText, CssBaseline, Box, Container } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import './App.css';

import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import StatsPage from './pages/StatsPage';
import JobsPage from './pages/JobsPage';
import YearsPage from './pages/YearsPage';
import PersonsPage from './pages/PersonsPage';
import AssignmentsPage from './pages/AssignmentsPage';

const drawerWidth = 220;
const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Companies', path: '/companies' },
  { label: 'Jobs', path: '/jobs' },
  { label: 'Years', path: '/years' },
  { label: 'Persons', path: '/persons' },
  { label: 'Assignments', path: '/assignments' },
  { label: 'Statistics', path: '/stats' },
];

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              BFops Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => (
                <ListItemButton key={item.label} component={Link} to={item.path}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="xl">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/years" element={<YearsPage />} />
              <Route path="/persons" element={<PersonsPage />} />
              <Route path="/assignments" element={<AssignmentsPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
