import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/translator';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

interface Unite { id: number; name: string; }

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [unite, setUnite] = useState<string>(() => sessionStorage.getItem('dashboard_unite') || '');
  const [company, setCompany] = useState<string>(() => sessionStorage.getItem('dashboard_company') || '');
  const [selectedJob, setSelectedJob] = useState<string>(() => sessionStorage.getItem('dashboard_selectedJob') || 'all');
  const [yearId, setYearId] = useState<string>(() => sessionStorage.getItem('dashboard_yearId') || '');

  const [unites, setUnites] = useState<Unite[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allPersons, setAllPersons] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  
  const [jobStats, setJobStats] = useState<any[]>([]);
  const [companyStats, setCompanyStats] = useState<any[]>([]);
  const [selectedTedStatus, setSelectedTedStatus] = useState<'ted' | 'not_ted' | null>(null);
  const [tedDetailsOpen, setTedDetailsOpen] = useState(false);

  // Persist filters to session storage when they change
  useEffect(() => {
    sessionStorage.setItem('dashboard_unite', unite);
    sessionStorage.setItem('dashboard_company', company);
    sessionStorage.setItem('dashboard_selectedJob', selectedJob);
    sessionStorage.setItem('dashboard_yearId', yearId);
  }, [unite, company, selectedJob, yearId]);

  useEffect(() => {
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
    axios.get('/api/companies/').then(res => setAllCompanies(res.data.results || res.data));
    axios.get('/api/jobs/').then(res => setAllJobs(res.data.results || res.data));
    axios.get('/api/persons/').then(res => setAllPersons(res.data.results || res.data));
    axios.get('/api/assignments/').then(res => setAllAssignments(res.data.results || res.data));
  }, []);

  useEffect(() => {
    const params: any = {};
    if (yearId) params.year_id = yearId;
    if (unite) params.unite_id = unite;
    if (company) params.company_id = company;
    if (selectedJob !== 'all') params.job_id = selectedJob;

    // Fetch Job Stats
    axios.get('/api/stats/jobs/', { params }).then(res => setJobStats(res.data.results || res.data));
    
    // Fetch Company Stats (ignoring job filters)
    const companyParams: any = { ...params };
    delete companyParams.job_id;
    axios.get('/api/stats/companies/', { params: companyParams }).then(res => setCompanyStats(res.data.results || res.data));
  }, [unite, company, selectedJob, yearId]);

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

  let filteredJobStats = jobStats;
  if (unite) {
    filteredJobStats = filteredJobStats.filter(j => String(j.unite_id) === String(unite));
  }
  if (company) {
    filteredJobStats = filteredJobStats.filter(j => String(j.company_id) === String(company));
  }
  if (selectedJob !== 'all') {
    filteredJobStats = filteredJobStats.filter(j => String(j.job_id) === String(selectedJob));
  } else if (unite && !company) {
    const aggregatedByJobName: Record<string, any> = {};

    filteredJobStats.forEach((job: any) => {
      const key = (job.job_name || '').trim().toLowerCase();
      if (!aggregatedByJobName[key]) {
        aggregatedByJobName[key] = {
          job_id: job.job_id,
          job_name: job.job_name,
          company_id: null,
          unite_id: job.unite_id,
          current_workers: 0,
          max_workers: 0,
        };
      }

      aggregatedByJobName[key].current_workers += Number(job.current_workers) || 0;
      aggregatedByJobName[key].max_workers += Number(job.max_workers) || 0;
    });

    filteredJobStats = Object.values(aggregatedByJobName).map((item: any) => {
      const difference = item.current_workers - item.max_workers;
      const percentage = item.max_workers > 0
        ? (difference / item.max_workers) * 100
        : 0;

      return {
        ...item,
        difference,
        percentage,
        status: (
          difference < 0
            ? 'deficit'
            : difference > 0
              ? 'surplus'
              : 'balanced'
        ),
      };
    });
  }

  const scopeJobs = useMemo(() => {
    let jobs = [...allJobs];

    if (unite) {
      const validCompanyIds = filteredCompanies.map((c: any) => String(c.id));
      jobs = jobs.filter((job: any) => validCompanyIds.includes(String(job.company)));
    }

    if (company) {
      jobs = jobs.filter((job: any) => String(job.company) === String(company));
    }

    if (selectedJob !== 'all') {
      jobs = jobs.filter((job: any) => String(job.id) === String(selectedJob));
    }

    return jobs;
  }, [allJobs, company, filteredCompanies, selectedJob, unite]);

  const latestAssignmentsByPerson = useMemo(() => {
    const normalizedYear = yearId.trim() === '' ? null : Number(yearId);
    const yearFilter = Number.isFinite(normalizedYear) ? normalizedYear : null;
    const latestByPerson = new Map<number, any>();

    allAssignments.forEach((assignment) => {
      const assignmentYear = assignment.year_value == null ? null : Number(assignment.year_value);
      if (yearFilter !== null && assignmentYear !== null && assignmentYear > yearFilter) {
        return;
      }

      const personId = Number(assignment.person);
      const current = latestByPerson.get(personId);
      if (!current) {
        latestByPerson.set(personId, assignment);
        return;
      }

      const currentTime = new Date(current.created_at || 0).getTime();
      const nextTime = new Date(assignment.created_at || 0).getTime();
      if (nextTime > currentTime || (nextTime === currentTime && Number(assignment.id) > Number(current.id))) {
        latestByPerson.set(personId, assignment);
      }
    });

    return latestByPerson;
  }, [allAssignments, yearId]);

  const tedJobsCount = scopeJobs.filter((job: any) => job.is_in_quota).length;
  const notTedJobsCount = scopeJobs.filter((job: any) => !job.is_in_quota).length;

  const tedJobIdSet = useMemo(() => new Set(scopeJobs.map((job: any) => String(job.id))), [scopeJobs]);
  const jobById = useMemo(() => {
    const map = new Map<number, any>();
    allJobs.forEach((job: any) => map.set(Number(job.id), job));
    return map;
  }, [allJobs]);

  const tedPersonRows = useMemo(() => {
    return allPersons
      .map((person) => {
        const latestAssignment = latestAssignmentsByPerson.get(Number(person.id));
        if (!latestAssignment) return null;

        if (!tedJobIdSet.has(String(latestAssignment.job))) {
          return null;
        }

        const job = jobById.get(Number(latestAssignment.job));
        if (!job) return null;

        const isTed = Boolean(job.is_in_quota);
        if (selectedTedStatus === 'ted' && !isTed) return null;
        if (selectedTedStatus === 'not_ted' && isTed) return null;

        return {
          id: person.id,
          person_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
          matricule: person.matricule || person.national_id || '-',
          grade_name: person.grade_name || '-',
          contract_type: person.contract_type || '-',
          job_name: latestAssignment.job_name || job.name || '-',
          company_name: latestAssignment.company_name || job.company_name || '-',
          unite_name: latestAssignment.unite_name || '-',
          assignment_year: latestAssignment.year_value ?? '-',
          ted_label: isTed ? t('TED') : t('NOT TED'),
        };
      })
      .filter(Boolean);
  }, [allPersons, jobById, latestAssignmentsByPerson, selectedTedStatus, tedJobIdSet, t]);

  const handleJobPieClick = (_event: any, elements: any) => {
    if (!elements.length) return;
    const idx = elements[0].index;
    const status = ['deficit', 'balanced', 'surplus'][idx];
    
    if (filteredJobStats.length > 0) {
      let query = '?';
      if (unite) query += `unite=${unite}&`;
      if (company) query += `company=${company}`;
      
      const queryString = query !== '?' ? query.replace(/&$/, '') : '';
      navigate(`/unite-stats-detail-by-status/${status}${queryString}`);
    }
  };

  const jobBarData = {
    labels: filteredJobStats.map(j => [j.job_name, j.company_name || '']),
    datasets: [
      {
        label: t('Current Workers'),
        data: filteredJobStats.map(j => j.current_workers),
        backgroundColor: '#1976d2',
      },
      {
        label: t('Max Workers'),
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

  const companyBarData = {
    labels: companyStats.map(c => c.company_name),
    datasets: [
      {
        label: t('Current Workers'),
        data: companyStats.map(c => c.current_workers),
        backgroundColor: '#9c27b0',
      },
      {
        label: t('Max Workers'),
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

  const tedJobsBarData = {
    labels: [t('TED'), t('NOT TED')],
    datasets: [
      {
        label: t('Jobs'),
        data: [tedJobsCount, notTedJobsCount],
        backgroundColor: ['#1976d2', '#ef6c00'],
        borderRadius: 10,
        barPercentage: 0.55,
        categoryPercentage: 0.55,
      },
    ],
  };

  const handleTedJobsBarClick = (_event: any, elements: any) => {
    if (!elements.length) return;
    const selectedIndex = elements[0].index;
    setSelectedTedStatus(selectedIndex === 0 ? 'ted' : 'not_ted');
    setTedDetailsOpen(true);
  };

  const tedJobsBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        color: '#1f2937',
        font: { weight: 'bold' as const },
        formatter: (value: number) => value,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    onClick: handleTedJobsBarClick,
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        {t('Statistics Dashboard')}
      </Typography>
      
      {/* FILTERS */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <input
          type="number"
          style={{ width: '150px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          placeholder={t('Year (e.g. 2026)')}
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('Unite')}</InputLabel>
          <Select 
            value={unite} 
            label={t('Unite')} 
            onChange={e => {
              setUnite(e.target.value);
              setCompany('');
              setSelectedJob('all');
            }}
          >
            <MenuItem value="">{t('All Unites')}</MenuItem>
            {unites.map(u => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('Company')}</InputLabel>
          <Select 
            value={company} 
            label={t('Company')} 
            onChange={e => {
              setCompany(e.target.value);
              setSelectedJob('all');
            }} 
            disabled={!unite && filteredCompanies.length === 0}
          >
            <MenuItem value="">{t('All Companies')}</MenuItem>
            {filteredCompanies.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('Job')}</InputLabel>
          <Select
            value={selectedJob}
            label={t('Job')}
            onChange={e => setSelectedJob(e.target.value)}
            disabled={filteredDropdownJobs.length === 0}
          >
            <MenuItem value="all">{t('All Jobs')}</MenuItem>
            {filteredDropdownJobs.map(j => (
              <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* JOB CHARTS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="medium" mb={3}>{t('Job Capacity vs. Actual')}</Typography>
            <Bar data={jobBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
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
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="medium" mb={3}>
                {t('Company Capacity vs. Actual')}
              </Typography>
              <Bar data={companyBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
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

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="medium" mb={1}>
              {t('TED vs NOT TED Jobs')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('Click a bar to inspect the people assigned to jobs in that category.')}
            </Typography>
            <Box sx={{ height: 320 }}>
              <Bar data={tedJobsBarData} options={tedJobsBarOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={tedDetailsOpen} onClose={() => setTedDetailsOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedTedStatus === 'ted' ? t('TED Job Details') : t('NOT TED Job Details')}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${t('Jobs')}: ${selectedTedStatus === 'ted' ? tedJobsCount : notTedJobsCount}`} color="primary" variant="outlined" />
            <Chip label={`${t('Persons')}: ${tedPersonRows.length}`} color="secondary" variant="outlined" />
          </Box>

          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Person')}</TableCell>
                  <TableCell>{t('Matricule')}</TableCell>
                  <TableCell>{t('Grade')}</TableCell>
                  <TableCell>{t('Contract')}</TableCell>
                  <TableCell>{t('Job')}</TableCell>
                  <TableCell>{t('Company')}</TableCell>
                  <TableCell>{t('Unite')}</TableCell>
                  <TableCell>{t('Year')}</TableCell>
                  <TableCell>{t('TED Status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tedPersonRows.map((row: any) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.person_name}</TableCell>
                    <TableCell>{row.matricule}</TableCell>
                    <TableCell>{row.grade_name}</TableCell>
                    <TableCell>{row.contract_type}</TableCell>
                    <TableCell>{row.job_name}</TableCell>
                    <TableCell>{row.company_name}</TableCell>
                    <TableCell>{row.unite_name}</TableCell>
                    <TableCell>{row.assignment_year}</TableCell>
                    <TableCell>{row.ted_label}</TableCell>
                  </TableRow>
                ))}
                {tedPersonRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {t('No persons found for the selected TED status.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTedDetailsOpen(false)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;
