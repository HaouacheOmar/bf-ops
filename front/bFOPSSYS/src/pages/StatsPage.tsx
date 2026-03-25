import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Paper } from '@mui/material';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

interface Year { id: number; year: number; }
interface Unite { id: number; name: string; }

const StatsPage = () => {
  const navigate = useNavigate();

  // Filter States
  const [year, setYear] = useState<string>('');
  const [unite, setUnite] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('all');

  // Options States
  const [years, setYears] = useState<Year[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  
  // Data States
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [companyStats, setCompanyStats] = useState<any[]>([]);

  // Initial Fetch for Dropdowns
  useEffect(() => {
    axios.get('/api/years/').then(res => setYears(res.data.results || res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
    axios.get('/api/companies/').then(res => setAllCompanies(res.data.results || res.data));
    axios.get('/api/jobs/').then(res => setAllJobs(res.data.results || res.data));
  }, []);

  // Fetch Stats when Filters Change
  useEffect(() => {
    if (year) {
      const params: any = { year_id: year };
      if (unite) params.unite_id = unite;
      if (company) params.company_id = company;
      if (selectedJob !== 'all') params.job_id = selectedJob;
      
      axios.get('/api/stats/jobs/', { params }).then(res => setJobStats(res.data.results || res.data));
      axios.get('/api/stats/companies/', { params }).then(res => setCompanyStats(res.data.results || res.data));
    } else {
      setJobStats([]);
      setCompanyStats([]);
    }
  }, [year, unite, company, selectedJob]);

  // Dropdown Filtering Logic
  const filteredCompanies = unite 
    ? allCompanies.filter((c: any) => String(c.unite) === String(unite)) 
    : allCompanies;

  let filteredDropdownJobs = allJobs;
  if (company) {
    filteredDropdownJobs = allJobs.filter((j: any) => String(j.company) === String(company));
  } else if (unite) {
    const validCompanyIds = filteredCompanies.map((c: any) => String(c.id));
    filteredDropdownJobs = allJobs.filter((j: any) => validCompanyIds.includes(String(j.company)));
  }

  // Frontend redundancy filtering for Job Stats
  let filteredJobStats = jobStats;
  if (company) {
    filteredJobStats = filteredJobStats.filter(j => String(j.company_id) === String(company));
  }
  if (selectedJob !== 'all') {
    filteredJobStats = filteredJobStats.filter(j => String(j.job_id) === String(selectedJob));
  }

  // --- JOB CHART LOGIC ---
  const handleJobPieClick = (event: any, elements: any) => {
    if (!elements.length) return;
    const idx = elements[0].index;
    const status = ['deficit', 'balanced', 'surplus'][idx];
    
    if (year && filteredJobStats.length > 0) {
      let query = '?';
      if (unite) query += `unite=${unite}&`;
      if (company) query += `company=${company}`;
      
      const queryString = query !== '?' ? query.replace(/&$/, '') : '';
      navigate(`/unite-stats-detail-by-status/${status}/${year}${queryString}`);
    }
  };

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

  const statusLabels = ['Deficit', 'Balanced', 'Surplus'];
  const statusColors = ['#e57373', '#81c784', '#ffd54f'];
  
  let jobTotalDeficit = 0, jobTotalBalanced = 0, jobTotalSurplus = 0;
  filteredJobStats.forEach(job => {
    if (job.max_workers > 0) {
      if (job.current_workers < job.max_workers) {
        jobTotalDeficit += job.max_workers - job.current_workers;
        jobTotalBalanced += job.current_workers;
      } else if (job.current_workers === job.max_workers) {
        jobTotalBalanced += job.max_workers;
      } else {
        jobTotalBalanced += job.max_workers;
        jobTotalSurplus += job.current_workers - job.max_workers;
      }
    }
  });
  
  const jobTotal = jobTotalDeficit + jobTotalBalanced + jobTotalSurplus;
  const jobStatusPieData = {
    labels: statusLabels,
    datasets: [{ data: [jobTotalDeficit, jobTotalBalanced, jobTotalSurplus], backgroundColor: statusColors }],
  };

  const jobStatusPieOptions = {
    plugins: {
      legend: { position: 'top' as const },
      datalabels: {
        display: true, color: '#333', font: { weight: 'bold' as const },
        formatter: (value: number) => {
          if (!jobTotal || value === 0) return '';
          return `${((value / jobTotal) * 100).toFixed(1)}% (${value})`;
        },
      },
    },
    onClick: handleJobPieClick, 
  };

  // --- COMPANY CHART LOGIC ---
  const companyBarData = {
    labels: companyStats.map(c => c.company_name),
    datasets: [
      {
        label: 'Current Workers',
        data: companyStats.map(c => c.current_workers),
        backgroundColor: '#9c27b0',
      },
      {
        label: 'Max Workers',
        data: companyStats.map(c => c.max_workers),
        backgroundColor: '#ce93d8',
      },
    ],
  };

  let compTotalDeficit = 0, compTotalBalanced = 0, compTotalSurplus = 0;
  companyStats.forEach(comp => {
    if (comp.max_workers > 0) {
      if (comp.current_workers < comp.max_workers) {
        compTotalDeficit += comp.max_workers - comp.current_workers;
        compTotalBalanced += comp.current_workers;
      } else if (comp.current_workers === comp.max_workers) {
        compTotalBalanced += comp.max_workers;
      } else {
        compTotalBalanced += comp.max_workers;
        compTotalSurplus += comp.current_workers - comp.max_workers;
      }
    }
  });
  
  const compTotal = compTotalDeficit + compTotalBalanced + compTotalSurplus;
  const companyStatusPieData = {
    labels: statusLabels,
    datasets: [{ data: [compTotalDeficit, compTotalBalanced, compTotalSurplus], backgroundColor: statusColors }],
  };

  const companyStatusPieOptions = {
    plugins: {
      legend: { position: 'top' as const },
      datalabels: {
        display: true, color: '#333', font: { weight: 'bold' as const },
        formatter: (value: number) => {
          if (!compTotal || value === 0) return '';
          return `${((value / compTotal) * 100).toFixed(1)}% (${value})`;
        },
      },
    },
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        Statistics Dashboard
      </Typography>
      
      {/* FILTERS */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={e => setYear(e.target.value)}>
            {years.map(y => (
              <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Unite</InputLabel>
          <Select 
            value={unite} 
            label="Unite" 
            onChange={e => {
              setUnite(e.target.value);
              setCompany('');
              setSelectedJob('all');
            }}
          >
            <MenuItem value="">All Unites</MenuItem>
            {unites.map(u => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Company</InputLabel>
          <Select 
            value={company} 
            label="Company" 
            onChange={e => {
              setCompany(e.target.value);
              setSelectedJob('all');
            }} 
            disabled={!unite && filteredCompanies.length === 0}
          >
            <MenuItem value="">All Companies</MenuItem>
            {filteredCompanies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Job</InputLabel>
          <Select
            value={selectedJob}
            label="Job"
            onChange={e => setSelectedJob(e.target.value)}
            disabled={filteredDropdownJobs.length === 0}
          >
            <MenuItem value="all">All Jobs</MenuItem>
            {filteredDropdownJobs.map(j => (
              <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {year && (
        <>
          {/* JOB CHARTS */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight="medium" mb={3}>Job Capacity vs. Actual</Typography>
                <Bar data={jobBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="medium" mb={3}>Job Status Breakdown</Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie data={jobStatusPieData} options={jobStatusPieOptions} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* COMPANY CHARTS */}
          {companyStats.length > 0 && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={7}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Typography variant="h6" fontWeight="medium" mb={3}>
                    Company Capacity vs. Actual
                  </Typography>
                  <Bar data={companyBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="medium" mb={3}>
                    Company Status Breakdown
                  </Typography>
                  <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Pie data={companyStatusPieData} options={companyStatusPieOptions} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default StatsPage;