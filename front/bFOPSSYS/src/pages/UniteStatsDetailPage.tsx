import React, { useEffect, useState } from 'react';
import { Typography, Paper, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS } from 'chart.js';
ChartJS.register(ChartDataLabels);

interface JobStat {
  job_id: number;
  job_name: string;
  company_id: number;
  company_name: string;
  current_workers: number;
  max_workers: number;
  difference: number;
  percentage: number;
  status: 'deficit' | 'balanced' | 'surplus';
}

interface Company {
  id: number;
  name: string;
}


import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const UniteStatsDetailPage: React.FC<{ uniteId: string; yearId: string }> = ({ uniteId, yearId }) => {
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');

  useEffect(() => {
    axios.get('/api/stats/jobs/', { params: { year_id: yearId, unite_id: uniteId } }).then(res => setJobStats(res.data));
    axios.get('/api/companies/', { params: { unite: uniteId } }).then(res => setCompanies(res.data));
    axios.get('/api/jobs/').then(res => setJobs(res.data));
  }, [uniteId, yearId]);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Unite Details
        </Typography>
        <FormControl sx={{ minWidth: 200, mb: 3 }}>
          <InputLabel>Job</InputLabel>
          <Select
            value={selectedJob}
            label="Job"
            onChange={e => setSelectedJob(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {jobs.map(j => (
              <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {companies.map(company => {
          let companyJobs = jobStats.filter(j => j.company_id === company.id);
          if (selectedJob !== 'all') {
            companyJobs = companyJobs.filter(j => String(j.job_id) === String(selectedJob));
          }
          const barData = {
            labels: companyJobs.map(j => j.job_name),
            datasets: [
              {
                label: 'Current Workers',
                data: companyJobs.map(j => j.current_workers),
                backgroundColor: '#1976d2',
              },
              {
                label: 'Max Workers',
                data: companyJobs.map(j => j.max_workers),
                backgroundColor: '#90caf9',
              },
            ],
          };
          return (
            <Paper key={company.id} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6">{company.name}</Typography>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    datalabels: {
                      display: true,
                      color: '#333',
                      font: { weight: 'bold' },
                      anchor: 'end',
                      align: 'top',
                      formatter: (value, context) => {
                        if (context.dataset.label === 'Current Workers') {
                          const idx = context.dataIndex;
                          const job = companyJobs[idx];
                          const missing = job.difference < 0 ? `Missing: ${-job.difference}` : '';
                          return `${job.percentage.toFixed(1)}%\n${missing}`;
                        }
                        return '';
                      },
                    },
                  },
                }}
              />
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Job</TableCell>
                      <TableCell align="right">Current Workers</TableCell>
                      <TableCell align="right">Max Workers</TableCell>
                      <TableCell align="right">Missing</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyJobs.map((job) => (
                      <TableRow key={job.job_id}>
                        <TableCell>{job.job_name}</TableCell>
                        <TableCell align="right">{job.current_workers}</TableCell>
                        <TableCell align="right">{job.max_workers}</TableCell>
                        <TableCell align="right">{job.difference < 0 ? -job.difference : 0}</TableCell>
                        <TableCell align="right">{job.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          );
        })}
      </Paper>
    </Container>
  );
};

export default UniteStatsDetailPage;
