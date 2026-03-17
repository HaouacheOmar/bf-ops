import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Paper } from '@mui/material';
import axios from 'axios';
import { Bar, Pie, getElementAtEvent } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';

interface Year { id: number; year: number; }
interface Unite { id: number; name: string; }

const StatsPage = () => {
  const navigate = useNavigate();
    // Handler for pie chart segment click
    const handlePieClick = (event: any, elements: any) => {
      if (!elements.length) return;
      const idx = elements[0].index;
      const status = ['deficit', 'balanced', 'surplus'][idx];
      // Find all unites with that status
      // For full detail, navigate to a custom route with status filter (or the first unite for now)
      // You can extend this to a dedicated page for all unites with that status
      if (year && pieJobStats.length > 0) {
        // Option 1: Navigate to the first unite with that status (as before)
        // const filtered = uniteStats.filter(u => u.status === status);
        // if (filtered.length) {
        //   navigate(`/unite-stats/${filtered[0].unite_id}/${year}`);
        // }
        // Option 2: Navigate to a custom route with status filter (recommended for full detail)
        navigate(`/unite-stats-detail-by-status/${status}/${year}`);
      }
    };
  const [year, setYear] = useState<string>('');
  const [years, setYears] = useState<Year[]>([]);
  const [unite, setUnite] = useState<string>('');
  const [unites, setUnites] = useState<Unite[]>([]);
  const [company, setCompany] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');

  useEffect(() => {
    axios.get('/api/years/').then(res => setYears(res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data));
  }, []);

  // Fetch companies when unite changes
  useEffect(() => {
    if (unite) {
      axios.get('/api/companies/', { params: { unite } }).then(res => setCompanies(res.data));
    } else {
      setCompanies([]);
    }
    setCompany('');
    setJobs([]);
    setSelectedJob('all');
  }, [unite]);

  // Fetch jobs when company or unite changes
  useEffect(() => {
    if (company) {
      axios.get('/api/jobs/', { params: { company } }).then(res => setJobs(res.data));
    } else if (unite) {
      axios.get('/api/jobs/', { params: { unite } }).then(res => setJobs(res.data));
    } else {
      setJobs([]);
    }
    setSelectedJob('all');
  }, [company, unite]);

  useEffect(() => {
    if (year) {
      const params: any = { year_id: year };
      if (unite) params.unite_id = unite;
      if (company) params.company_id = company;
      if (selectedJob !== 'all') params.job_id = selectedJob;
      axios.get('/api/stats/jobs/', { params }).then(res => setJobStats(res.data));
    }
  }, [year, unite, company, selectedJob]);

  // Filter jobStats by company and selected job
  let filteredJobStats = jobStats;
  if (company) {
    filteredJobStats = filteredJobStats.filter(j => String(j.company_id) === String(company));
  }
  if (selectedJob !== 'all') {
    filteredJobStats = filteredJobStats.filter(j => String(j.job_id) === String(selectedJob));
  }

  const jobBarData = {
    labels: filteredJobStats.map(j => j.job_name),
    datasets: [
      {
        label: 'Current Workers',
        data: filteredJobStats.map(j => j.current_workers),
        backgroundColor: '#1976d2',
      },
      {
        label: 'Max Workers',
        data: filteredJobStats.map(j => j.max_workers),
        backgroundColor: '#90caf9',
      },
    ],
  };

  // Job Status Breakdown: pie chart showing overall deficit, balanced, surplus percentages across all filtered jobs
  const jobStatusLabels = ['Deficit', 'Balanced', 'Surplus'];
  const statusColors = ['#e57373', '#81c784', '#ffd54f'];
  let totalDeficit = 0, totalBalanced = 0, totalSurplus = 0;
  filteredJobStats.forEach(job => {
    if (job.max_workers > 0) {
      if (job.current_workers < job.max_workers) {
        totalDeficit += job.max_workers - job.current_workers;
        totalBalanced += job.current_workers;
      } else if (job.current_workers === job.max_workers) {
        totalBalanced += job.max_workers;
      } else {
        totalBalanced += job.max_workers;
        totalSurplus += job.current_workers - job.max_workers;
      }
    }
  });
  const total = totalDeficit + totalBalanced + totalSurplus;
  const jobStatusPieData = {
    labels: jobStatusLabels,
    datasets: [
      {
        data: [totalDeficit, totalBalanced, totalSurplus],
        backgroundColor: statusColors,
      },
    ],
  };
  const jobStatusPieOptions = {
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        display: true,
        color: '#333',
        font: { weight: 'bold' },
        formatter: (value: number, context: any) => {
          if (!total) return '';
          const percent = (value / total) * 100;
          return `${percent.toFixed(1)}% (${value})`;
        },
      },
    },
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
      <FormControl sx={{ minWidth: 200, mb: 3, ml: 2 }}>
        <InputLabel>Company</InputLabel>
        <Select value={company} label="Company" onChange={e => setCompany(e.target.value)} disabled={!unite || companies.length === 0}>
          <MenuItem value="">All Companies</MenuItem>
          {companies.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {year && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Job Capacity vs. Actual</Typography>
              <FormControl sx={{ minWidth: 200, mb: 2 }}>
                <InputLabel>Job</InputLabel>
                <Select
                  value={selectedJob}
                  label="Job"
                  onChange={e => setSelectedJob(e.target.value)}
                  disabled={jobs.length === 0}
                >
                  <MenuItem value="all">All</MenuItem>
                  {jobs.map(j => (
                    <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Bar data={jobBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Job Status Breakdown</Typography>
              <Pie data={jobStatusPieData} options={jobStatusPieOptions} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StatsPage;