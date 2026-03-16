import { useEffect, useState } from 'react';
import { Typography, Box, Paper, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import Grid from '@mui/material/Grid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const DashboardPage = () => {
  const [year, setYear] = useState<number>(2024);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [companyStats, setCompanyStats] = useState<any[]>([]);
  const [jobStats, setJobStats] = useState<any[]>([]);

  // Helper to ensure data is always an array
  const safeArray = (data: any) => Array.isArray(data) ? data : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      axios.get('/api/service-statistics/', { params: { year_id: year } }),
      axios.get('/api/company-statistics/', { params: { year_id: year } }),
      axios.get('/api/job-statistics/', { params: { year_id: year } })
    ])
      .then(([serviceRes, companyRes, jobRes]) => {
        setServiceStats(serviceRes.data);
        setCompanyStats(companyRes.data);
        setJobStats(jobRes.data);
      })
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <FormControl sx={{ mb: 3, minWidth: 120 }}>
        <InputLabel>Year</InputLabel>
        <Select value={year} label="Year" onChange={e => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map(y => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={3} columns={12}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Service Statistics</Typography>
            {safeArray(serviceStats).length === 0 && !loading && !error ? (
              <Typography color="text.secondary">No data available.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeArray(serviceStats)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="service_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_workers" fill="#1976d2" name="Current Workers" />
                  <Bar dataKey="max_workers" fill="#90caf9" name="Max Workers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Company Statistics</Typography>
            {safeArray(companyStats).length === 0 && !loading && !error ? (
              <Typography color="text.secondary">No data available.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeArray(companyStats)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="company_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_workers" fill="#388e3c" name="Current Workers" />
                  <Bar dataKey="max_workers" fill="#a5d6a7" name="Max Workers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid sx={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Job Statistics</Typography>
            {safeArray(jobStats).length === 0 && !loading && !error ? (
              <Typography color="text.secondary">No data available.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeArray(jobStats)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="job_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_workers" fill="#fbc02d" name="Current Workers" />
                  <Bar dataKey="max_workers" fill="#ffe082" name="Max Workers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
