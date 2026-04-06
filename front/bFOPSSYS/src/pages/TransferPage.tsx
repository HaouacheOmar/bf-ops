import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useI18n } from '../i18n/translator';

type Assignment = {
  id: number;
  person_name: string;
  job_name: string;
  unite_id?: number | null;
  unite_name: string;
};

type Unite = {
  id: number;
  name: string;
  code: string;
};

type Company = {
  id: number;
  name: string;
  code: string;
  unite: number | null;
  unite_name: string;
};

type Job = {
  id: number;
  name: string;
  code: string;
  company: number;
};

type Transfer = {
  id: number;
  person_name: string;
  from_unite_name: string;
  to_unite_name: string;
  transfer_date: string;
  reason: string;
};

const asList = (payload: any) => payload?.results || payload || [];

export default function TransferPage() {
  const { t } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [reason, setReason] = useState('');
  const [transferError, setTransferError] = useState('');

  const [currentWorkerInfo, setCurrentWorkerInfo] = useState<Assignment | null>(null);

  const loadTransfers = async () => {
    const transfersRes = await fetch('/api/transfers/?ordering=-transfer_date');
    const transfersData = await transfersRes.json();
    setTransfers(asList(transfersData));
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/assignments/').then((res) => res.json()),
      fetch('/api/unites/').then((res) => res.json()),
      fetch('/api/companies/').then((res) => res.json()),
      fetch('/api/jobs/').then((res) => res.json()),
      fetch('/api/transfers/?ordering=-transfer_date').then((res) => res.json()),
    ]).then(([assignmentsData, unitesData, companiesData, jobsData, transfersData]) => {
      setAssignments(asList(assignmentsData));
      setUnites(asList(unitesData));
      setCompanies(asList(companiesData));
      setJobs(asList(jobsData));
      setTransfers(asList(transfersData));
    });
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      setCurrentWorkerInfo(assignments.find((a) => String(a.id) === selectedAssignment) || null);
    } else {
      setCurrentWorkerInfo(null);
    }
  }, [selectedAssignment, assignments]);

  const destinationCompanies = useMemo(
    () => companies.filter((company) => String(company.unite) === selectedUnite),
    [companies, selectedUnite],
  );

  const destinationUnites = useMemo(() => {
    if (!currentWorkerInfo?.unite_id) {
      return unites;
    }
    return unites.filter((unite) => unite.id !== currentWorkerInfo.unite_id);
  }, [unites, currentWorkerInfo]);

  const destinationJobs = useMemo(() => {
    if (selectedCompany) {
      return jobs.filter((job) => String(job.company) === selectedCompany);
    }
    const companyIds = new Set(destinationCompanies.map((company) => company.id));
    return jobs.filter((job) => companyIds.has(job.company));
  }, [jobs, destinationCompanies, selectedCompany]);

  useEffect(() => {
    setSelectedCompany('');
    setSelectedJob('');
  }, [selectedUnite]);

  useEffect(() => {
    setSelectedJob('');
  }, [selectedCompany]);

  const handleTransfer = async () => {
    setTransferError('');

    if (!selectedAssignment || !selectedUnite) {
      alert(t('Please select a worker and a destination unite.'));
      return;
    }

    if (currentWorkerInfo?.unite_id && String(currentWorkerInfo.unite_id) === selectedUnite) {
      setTransferError(t('The worker is already in this unite. Please choose another unite.'));
      return;
    }

    const response = await fetch('/api/transfers-execute/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignment_id: selectedAssignment,
        new_unite_id: selectedUnite,
        new_company_id: selectedCompany || null,
        new_job_id: selectedJob || null,
        reason: reason
      })
    });
    
    const data = await response.json();

    if (response.ok) {
      alert(t(data?.message || 'Transfer completed successfully.'));
      setSelectedAssignment('');
      setSelectedUnite('');
      setSelectedCompany('');
      setSelectedJob('');
      setReason('');
      await loadTransfers();
    } else {
      setTransferError(t(data?.error || 'An error occurred during transfer.'));
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        width: '100%',
        background: 'linear-gradient(180deg, rgba(237,247,255,0.8) 0%, rgba(255,255,255,1) 35%)',
        borderRadius: 3,
      }}
    >
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 0.5 }}>
        {t('Transfer Center')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('Transfer an employee between unites and optionally assign a destination company and job.')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="medium" mb={3}>
              {t('Unite Transfer')}
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('1. Select Worker')}</InputLabel>
              <Select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                label={t('1. Select Worker')}
              >
                {assignments.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.person_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentWorkerInfo && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>{t('Current Unite:')}</strong> {currentWorkerInfo.unite_name || t('Unknown Unite')}
                <br />
                <span style={{ fontSize: '0.85em', color: '#555' }}>
                  ({t('Current Job:')} {currentWorkerInfo.job_name})
                </span>
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('2. Destination Unite')}</InputLabel>
              <Select
                value={selectedUnite}
                onChange={(e) => setSelectedUnite(e.target.value)}
                label={t('2. Destination Unite')}
              >
                {destinationUnites.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {transferError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {transferError}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }} disabled={!selectedUnite}>
              <InputLabel>{t('3. Company (optional)')}</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                label={t('3. Company (optional)')}
              >
                <MenuItem value="">{t('No selection')}</MenuItem>
                {destinationCompanies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }} disabled={!selectedUnite}>
              <InputLabel>{t('4. Job (optional)')}</InputLabel>
              <Select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                label={t('4. Job (optional)')}
              >
                <MenuItem value="">{t('Pending assignment')}</MenuItem>
                {destinationJobs.map((job) => (
                  <MenuItem key={job.id} value={String(job.id)}>
                    {job.name} ({job.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t('Transfer reason (optional)')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 4 }}
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleTransfer}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              {t('Confirm Transfer')}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="medium">
                {t('Transfer History')}
              </Typography>
              <Chip label={`${transfers.length} ${t('transfers')}`} color="primary" variant="outlined" />
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Employee')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('From')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('To')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Date')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Reason')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>{transfer.person_name}</TableCell>
                    <TableCell>{transfer.from_unite_name || '-'}</TableCell>
                    <TableCell>{transfer.to_unite_name || '-'}</TableCell>
                    <TableCell>{new Date(transfer.transfer_date).toLocaleDateString()}</TableCell>
                    <TableCell>{transfer.reason || '-'}</TableCell>
                  </TableRow>
                ))}
                {transfers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      {t('No transfer records found.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}