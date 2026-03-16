import React, { useEffect, useState } from 'react';
import { Typography, Paper, Container } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

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

const UniteStatsDetailPage: React.FC<{ uniteId: string; yearId: string }> = ({ uniteId, yearId }) => {
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    axios.get('/api/stats/jobs/', { params: { year_id: yearId, unite_id: uniteId } }).then(res => setJobStats(res.data));
    axios.get('/api/companies/', { params: { unite: uniteId } }).then(res => setCompanies(res.data));
  }, [uniteId, yearId]);

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Unite Details
        </Typography>
        {companies.map(company => {
          const companyJobs = jobStats.filter(j => j.company_id === company.id);
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
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Paper>
          );
        })}
      </Paper>
    </Container>
  );
};

export default UniteStatsDetailPage;
