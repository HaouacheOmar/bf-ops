import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Paper } from '@mui/material';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
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

interface Year { id: number; year: number; }

const StatsPage = () => {
  const [year, setYear] = useState<string>('');
  const [years, setYears] = useState<Year[]>([]);
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [uniteStats, setUniteStats] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/years/').then(res => setYears(res.data));
  }, []);

  useEffect(() => {
    if (year) {
      axios.get('/api/stats/jobs/', { params: { year_id: year } }).then(res => setJobStats(res.data));
      axios.get('/api/stats/unites/', { params: { year_id: year } }).then(res => setUniteStats(res.data));
    }
  }, [year]);

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
              <Pie data={unitePieData} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StatsPage;
