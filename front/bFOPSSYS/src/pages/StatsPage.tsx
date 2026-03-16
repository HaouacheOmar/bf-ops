import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Paper } from '@mui/material';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


interface Unite { id: number; name: string; }

const StatsPage = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState<string>('');
  const [years, setYears] = useState<Year[]>([]);
  const [unite, setUnite] = useState<string>('');
  const [unites, setUnites] = useState<Unite[]>([]);
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [uniteStats, setUniteStats] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/years/').then(res => setYears(res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data));
  }, []);

  useEffect(() => {
    if (year) {
      const params: any = { year_id: year };
      if (unite) params.unite_id = unite;
      axios.get('/api/stats/jobs/', { params }).then(res => setJobStats(res.data));
      axios.get('/api/stats/unites/', { params }).then(res => setUniteStats(res.data));
    }
  }, [year, unite]);

  // Bar chart for job stats
  const jobBarData = {
    labels: jobStats.map(j => j.job_name),
    datasets: [
      {
        label: 'Current Workers',
        data: jobStats.map(j => j.current_workers),
        backgroundColor: '#1976d2',
      },
      {
        label: 'Max Workers',
        data: jobStats.map(j => j.max_workers),
        backgroundColor: '#90caf9',
      },
    ],
  };

  // Pie chart for unite status
  const unitePieData = {
    labels: ['Deficit', 'Balanced', 'Surplus'],
    datasets: [
      {
        data: [
          uniteStats.filter(u => u.status === 'deficit').length,
          uniteStats.filter(u => u.status === 'balanced').length,
          uniteStats.filter(u => u.status === 'surplus').length,
        ],
        backgroundColor: ['#e57373', '#81c784', '#ffd54f'],
      },
    ],
  };

  // Handler for pie chart segment click
  const handlePieClick = (event: any, elements: any) => {
    if (!elements.length) return;
    const idx = elements[0].index;
    const status = ['deficit', 'balanced', 'surplus'][idx];
    // Find first unite with that status (or show all)
    const filtered = uniteStats.filter(u => u.status === status);
    if (filtered.length && year) {
      // Navigate to details for the first unite
      navigate(`/unite-stats/${filtered[0].unite_id}/${year}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Statistics Dashboard</Typography>
      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Year</InputLabel>
        <Select value={year} label="Year" onChange={e => setYear(e.target.value)}>
          {years.map(y => (
            <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 200, mb: 3, ml: 2 }}>
        <InputLabel>Unite</InputLabel>
        <Select value={unite} label="Unite" onChange={e => setUnite(e.target.value)}>
          <MenuItem value="">All Unites</MenuItem>
          {unites.map(u => (
            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {year && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Job Capacity vs. Actual</Typography>
              <Bar data={jobBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Unite Status Distribution</Typography>
              <Pie data={unitePieData} getElementAtEvent={handlePieClick} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StatsPage;
