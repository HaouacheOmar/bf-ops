import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';

interface UniteStat {
  unite_id: number;
  unite_name: string;
  status: 'deficit' | 'balanced' | 'surplus';
  jobs: Array<{
    job_id: number;
    job_name: string;
    company_id: number;
    company_name: string;
    current_workers: number;
    max_workers: number;
    difference: number;
    percentage: number;
    status: 'deficit' | 'balanced' | 'surplus';
  }>;
}

const UniteStatsDetailByStatusPage: React.FC = () => {
  const { status, year } = useParams<{ status: string; year: string }>();
  const [uniteStats, setUniteStats] = useState<UniteStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year) return;
    axios.get('/api/stats/unites/', { params: { year_id: year } })
      .then(res => {
        // Filter unites by status
        const filtered = res.data.filter((u: UniteStat) => u.status === status);
        setUniteStats(filtered);
      })
      .finally(() => setLoading(false));
  }, [status, year]);

  if (loading) return <div>Loading...</div>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Unites with status: {status}
      </Typography>
      {uniteStats.length === 0 && <Typography>No unites found for this status.</Typography>}
      {uniteStats.map(unite => (
        <Paper key={unite.unite_id} sx={{ p: 3, mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {unite.unite_name}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell align="right">Current Workers</TableCell>
                  <TableCell align="right">Max Workers</TableCell>
                  <TableCell align="right">Missing</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unite.jobs.map((job) => (
                  <TableRow key={job.job_id}>
                    <TableCell>{job.job_name}</TableCell>
                    <TableCell>{job.company_name}</TableCell>
                    <TableCell align="right">{job.current_workers}</TableCell>
                    <TableCell align="right">{job.max_workers}</TableCell>
                    <TableCell align="right">{job.difference < 0 ? -job.difference : 0}</TableCell>
                    <TableCell align="right">{job.percentage.toFixed(1)}%</TableCell>
                    <TableCell align="right">{job.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Container>
  );
};

export default UniteStatsDetailByStatusPage;
