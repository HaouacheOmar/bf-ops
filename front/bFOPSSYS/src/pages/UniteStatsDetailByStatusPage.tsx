import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';
import { useI18n } from '../i18n/translator';

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
  const { t } = useI18n();
  const { status } = useParams<{ status: string }>();
  const [uniteStats, setUniteStats] = useState<UniteStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearId, setYearId] = useState<string>(() => sessionStorage.getItem('unite_status_year') || '');

  useEffect(() => {
    sessionStorage.setItem('unite_status_year', yearId);
  }, [yearId]);

  useEffect(() => {
    if (!status) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = yearId ? { year_id: yearId } : {};

    axios.get('/api/stats/unites/', { params })
      .then(res => {
        // Filter unites by status
        const filtered = res.data.filter((u: UniteStat) => u.status === status);
        setUniteStats(filtered);
      })
      .finally(() => setLoading(false));
  }, [status, yearId]);

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('Unites with status:')} {t(status || '')}
        </Typography>
        <Box>
          <input
            type="number"
            className="filter-select"
            style={{ width: '150px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder={t('Year (e.g. 2026)')}
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
          />
        </Box>
      </Box>

      {loading ? (
        <Typography>{t('Loading...')}</Typography>
      ) : (
        <>
          {uniteStats.length === 0 && <Typography>{t('No unites found for this status.')}</Typography>}
          {uniteStats.map(unite => (
        <Paper key={unite.unite_id} sx={{ p: 3, mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {unite.unite_name}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('Job')}</TableCell>
                  <TableCell>{t('Company')}</TableCell>
                  <TableCell align="right">{t('Current Workers')}</TableCell>
                  <TableCell align="right">{t('Max Workers')}</TableCell>
                  <TableCell align="right">{t('Missing')}</TableCell>
                  <TableCell align="right">{t('Percentage')}</TableCell>
                  <TableCell align="right">{t('Unite Percentage')}</TableCell>
                  <TableCell align="right">{t('Status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(unite.jobs || []).map((job) => {
                  const sameJobsInUnite = (unite.jobs || []).filter(j => j.job_name === job.job_name);
                  const totalCurrent = sameJobsInUnite.reduce((acc, j) => acc + j.current_workers, 0);
                  const totalMax = sameJobsInUnite.reduce((acc, j) => acc + j.max_workers, 0);
                  const uniteDiff = totalCurrent - totalMax;
                  const unitePercentage = totalMax > 0 ? (uniteDiff / totalMax) * 100 : 0;
                  return (
                    <TableRow 
                      key={job.job_id}
                      sx={{ 
                        ...(job.status === 'deficit' && { bgcolor: '#ffebee' }),
                        ...(job.status === 'surplus' && { bgcolor: '#fff8e1' }),
                        ...(job.status === 'balanced' && { bgcolor: '#e8f5e9' }),
                      }}
                    >
                      <TableCell>{job.job_name}</TableCell>
                      <TableCell>{job.company_name}</TableCell>
                      <TableCell align="right">{job.current_workers}</TableCell>
                      <TableCell align="right">{job.max_workers}</TableCell>
                      <TableCell align="right">{job.difference < 0 ? -job.difference : 0}</TableCell>
                      <TableCell align="right">{job.percentage.toFixed(1)}%</TableCell>
                      <TableCell align="right">{unitePercentage.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 'bold',
                        ...(job.status === 'deficit' && { color: '#c62828' }),
                        ...(job.status === 'surplus' && { color: '#f57f17' }),
                        ...(job.status === 'balanced' && { color: '#2e7d32' }),
                      }}>
                        {t(job.status)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Box>
  );
};

export default UniteStatsDetailByStatusPage;
