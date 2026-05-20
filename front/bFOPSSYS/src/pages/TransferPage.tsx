import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Autocomplete,
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

type Person = {
  id: number;
  first_name: string;
  last_name: string;
  matricule: string;
  unite_id?: number | null;
  unite?: number | null;
  unite_name?: string;
  company_id?: number | null;
  company?: number | null;
  company_name?: string;
  job?: number | null;
  job_name?: string;
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

type Year = {
  id: number;
  year: number;
};

type TransferLeg = {
  unite_id: number;
  unite_name: string;
  company_id: number;
  company_name: string;
  job_id: number;
  job_name: string;
};

type TransferSuggestion = {
  assignment_id: number;
  person_name: string;
  transfer_type: 'internal' | 'external';
  requires_validation: boolean;
  source: TransferLeg;
  destination: TransferLeg;
  new_unite_id: number;
  new_company_id: number;
  new_job_id: number;
  reason: string;
};

type TransferMode = 'external' | 'intern';

const asList = (payload: any) => payload?.results || payload || [];

export default function TransferPage() {
  const { t } = useI18n();
  const [persons, setPersons] = useState<Person[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [suggestions, setSuggestions] = useState<TransferSuggestion[]>([]);

  const [selectedPerson, setSelectedPerson] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('external');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [reason, setReason] = useState('');
  const [transferError, setTransferError] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [validatingSuggestionId, setValidatingSuggestionId] = useState<number | null>(null);

  const [personSearch, setPersonSearch] = useState('');
  const [currentWorkerInfo, setCurrentWorkerInfo] = useState<Person | null>(null);

  const getCurrentUniteId = (person: Person | null) => person?.unite_id ?? person?.unite ?? null;

  const loadTransfers = async () => {
    const transfersRes = await fetch('/api/transfers/?ordering=-transfer_date');
    const transfersData = await transfersRes.json();
    setTransfers(asList(transfersData));
  };

  const loadSuggestions = async (yearIdParam?: string) => {
    const yearId = yearIdParam || selectedYear;
    if (!yearId) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    setSuggestionError('');
    try {
      const response = await fetch(`/api/transfers-suggestions/?year_id=${encodeURIComponent(yearId)}&limit=50`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Could not load suggested transfers.');
      }
      setSuggestions(asList(data));
    } catch (error) {
      setSuggestions([]);
      const message = error instanceof Error ? error.message : 'Could not load suggested transfers.';
      setSuggestionError(t(message));
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/years/?ordering=-year').then((res) => res.json()),
      fetch('/api/unites/').then((res) => res.json()),
      fetch('/api/companies/').then((res) => res.json()),
      fetch('/api/jobs/').then((res) => res.json()),
      fetch('/api/transfers/?ordering=-transfer_date').then((res) => res.json()),
    ]).then(([yearsData, unitesData, companiesData, jobsData, transfersData]) => {
      const parsedYears = asList(yearsData) as Year[];
      setYears(parsedYears);
      if (parsedYears.length > 0) {
        setSelectedYear(String(parsedYears[0].id));
      }
      setUnites(asList(unitesData));
      setCompanies(asList(companiesData));
      setJobs(asList(jobsData));
      setTransfers(asList(transfersData));
    });
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams();
      if (personSearch) {
        params.append('search', personSearch);
      }
      fetch(`/api/persons/?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setPersons(asList(data));
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [personSearch]);

  useEffect(() => {
    void loadSuggestions();
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedPerson) {
      setCurrentWorkerInfo(null);
    }
  }, [selectedPerson]);

  const searchOptions = useMemo(() => {
    if (currentWorkerInfo && !persons.find(p => p.id === currentWorkerInfo.id)) {
      return [...persons, currentWorkerInfo];
    }
    return persons;
  }, [persons, currentWorkerInfo]);

  const destinationCompanies = useMemo(
    () => {
      const effectiveUniteId = transferMode === 'intern'
        ? String(getCurrentUniteId(currentWorkerInfo) ?? '')
        : selectedUnite;
      const scopedCompanies = companies.filter((company) => String(company.unite) === effectiveUniteId);
      return scopedCompanies;
    },
    [companies, selectedUnite, transferMode, currentWorkerInfo],
  );

  const destinationUnites = useMemo(() => {
    const currentUniteId = getCurrentUniteId(currentWorkerInfo);
    if (!currentUniteId) {
      return unites;
    }
    if (transferMode === 'intern') {
      return unites.filter((unite) => unite.id === currentUniteId);
    }
    return unites.filter((unite) => unite.id !== currentUniteId);
  }, [unites, currentWorkerInfo, transferMode]);

  const destinationJobs = useMemo(() => {
    if (selectedCompany) {
      return jobs.filter((job) => String(job.company) === selectedCompany);
    }
    const companyIds = new Set(destinationCompanies.map((company) => company.id));
    return jobs.filter((job) => companyIds.has(job.company));
  }, [jobs, destinationCompanies, selectedCompany]);

  const currentJobExistsInDestinationCompany = useMemo(() => {
    if (transferMode !== 'intern' || !currentWorkerInfo?.job_name || !selectedCompany) {
      return true;
    }

    const normalizedCurrentJobName = String(currentWorkerInfo.job_name).trim().toLowerCase();
    return destinationJobs.some((job) => String(job.name).trim().toLowerCase() === normalizedCurrentJobName);
  }, [destinationJobs, currentWorkerInfo?.job_name, selectedCompany, transferMode]);

  useEffect(() => {
    setSelectedCompany('');
    setSelectedJob('');
  }, [selectedUnite]);

  useEffect(() => {
    setTransferError('');
    setSelectedCompany('');
    setSelectedJob('');

    if (!getCurrentUniteId(currentWorkerInfo)) {
      return;
    }

    if (transferMode === 'intern') {
      const currentUniteId = getCurrentUniteId(currentWorkerInfo);
      setSelectedUnite(currentUniteId ? String(currentUniteId) : '');
      return;
    }

    setSelectedUnite((prev) => (
      prev === String(getCurrentUniteId(currentWorkerInfo)) ? '' : prev
    ));
  }, [transferMode, currentWorkerInfo]);

  useEffect(() => {
    setSelectedJob('');
  }, [selectedCompany]);

  const handleTransfer = async () => {
    setTransferError('');

    const effectiveUniteId = transferMode === 'intern'
      ? (getCurrentUniteId(currentWorkerInfo) ? String(getCurrentUniteId(currentWorkerInfo)) : '')
      : selectedUnite;

    if (!selectedPerson || !effectiveUniteId) {
      alert(t('Please select a worker and a destination unite.'));
      return;
    }

    const selectedJobEntity = selectedJob
      ? jobs.find((job) => String(job.id) === selectedJob)
      : null;
    const destinationCompanyId = selectedCompany
      ? Number(selectedCompany)
      : selectedJobEntity?.company || null;

    if (transferMode === 'intern') {
      if (!destinationCompanyId) {
        setTransferError(t('For intern transfer, select a destination company or destination job.'));
        return;
      }
    } else if (currentWorkerInfo?.unite_id && String(currentWorkerInfo.unite_id) === selectedUnite) {
      setTransferError(t('The worker is already in this unite. Please choose another unite.'));
      return;
    }

    const response = await fetch('/api/transfers-execute/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person_id: selectedPerson,
        new_unite_id: effectiveUniteId,
        new_company_id: selectedCompany || null,
        new_job_id: selectedJob || null,
        reason: reason
      })
    });
    
    const data = await response.json();

    if (response.ok) {
      alert(t(data?.message || 'Transfer completed successfully.'));
      setSelectedPerson('');
      setSelectedUnite('');
      setSelectedCompany('');
      setSelectedJob('');
      setReason('');
      await Promise.all([loadTransfers(), loadSuggestions()]);
    } else {
      setTransferError(t(data?.error || 'An error occurred during transfer.'));
    }
  };

  const handleValidateSuggestion = async (suggestion: TransferSuggestion) => {
    const isConfirmed = window.confirm(t('Do you want to validate this suggested transfer?'));
    if (!isConfirmed) {
      return;
    }

    setSuggestionError('');
    setValidatingSuggestionId(suggestion.assignment_id);

    try {
      const response = await fetch('/api/transfers-execute/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: suggestion.assignment_id,
          new_unite_id: suggestion.new_unite_id,
          new_company_id: suggestion.new_company_id,
          new_job_id: suggestion.new_job_id,
          reason: suggestion.reason,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'An error occurred during transfer.');
      }

      alert(t(data?.message || 'Transfer completed successfully.'));
      await Promise.all([loadTransfers(), loadSuggestions()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during transfer.';
      setSuggestionError(t(message));
    } finally {
      setValidatingSuggestionId(null);
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
              <InputLabel>{t('Transfer Type')}</InputLabel>
              <Select
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value as TransferMode)}
                label={t('Transfer Type')}
              >
                <MenuItem value="external">{t('External (different unite)')}</MenuItem>
                <MenuItem value="intern">{t('Intern (same unite, different company)')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Autocomplete
                options={searchOptions}
                filterOptions={(options) => options}
                getOptionLabel={(option) => option.matricule ? `${option.first_name} ${option.last_name} (${option.matricule})` : `${option.first_name} ${option.last_name}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={currentWorkerInfo}
                onInputChange={(_, val) => setPersonSearch(val)}
                onChange={(_, val) => {
                  setSelectedPerson(val ? String(val.id) : '');
                  setCurrentWorkerInfo(val || null);
                }}
                renderInput={(params) => <TextField {...params} label={t('1. Select Worker')} variant="outlined" placeholder={t('Search by Name or Matricule...')} />}
              />
            </FormControl>

            {currentWorkerInfo && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>{t('Current Unite:')}</strong> {currentWorkerInfo.unite_name || t('Unknown Unite')}
                <br />
                <span style={{ fontSize: '0.85em', color: '#555' }}>
                  ({t('Current Job:')} {currentWorkerInfo.job_name})
                </span>
                {currentWorkerInfo.company_name && (
                  <>
                    <br />
                    <span style={{ fontSize: '0.85em', color: '#555' }}>
                      ({t('Current Company:')} {currentWorkerInfo.company_name})
                    </span>
                  </>
                )}
              </Alert>
            )}

            {transferMode === 'intern' ? (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                {t('Intern transfer stays within the same unite. You can choose a company and optionally assign a job, or leave the job pending.')}
              </Alert>
            ) : (
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
            )}

            {transferError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {transferError}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }} disabled={transferMode !== 'intern' && !selectedUnite}>
              <InputLabel>
                {transferMode === 'intern' ? t('3. Destination Company') : t('3. Company (optional)')}
              </InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                label={transferMode === 'intern' ? t('3. Destination Company') : t('3. Company (optional)')}
              >
                <MenuItem value="">{t('Select destination company...')}</MenuItem>
                {destinationCompanies.map((company) => (
                  <MenuItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {transferMode === 'intern' && selectedCompany && !currentJobExistsInDestinationCompany && currentWorkerInfo?.job_name && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                {t('The current job is not available in the destination company. This transfer will keep it as NOT TED / pending assignment unless you pick another job.')}
              </Alert>
            )}

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
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="medium">
                {t('Suggested Transfers')}
              </Typography>
              <Chip label={`${suggestions.length} ${t('Suggestions')}`} color="info" variant="outlined" />
            </Box>

            <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
              <FormControl sx={{ minWidth: 180 }} size="small">
                <InputLabel>{t('Year')}</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label={t('Year')}
                >
                  {years.map((yearOption) => (
                    <MenuItem key={yearOption.id} value={String(yearOption.id)}>
                      {yearOption.year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={() => void loadSuggestions()}
                disabled={!selectedYear || loadingSuggestions}
              >
                {t('Refresh suggestions')}
              </Button>
            </Box>

            {suggestionError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {suggestionError}
              </Alert>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Employee')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Transfer Type')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('From (Unite/Company/Job)')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('To (Unite/Company/Job)')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingSuggestions && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                      {t('Loading...')}
                    </TableCell>
                  </TableRow>
                )}

                {!loadingSuggestions && suggestions.map((suggestion) => (
                  <TableRow
                    key={`${suggestion.assignment_id}-${suggestion.destination.job_id}`}
                    hover
                  >
                    <TableCell>{suggestion.person_name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={suggestion.transfer_type === 'internal' ? 'primary' : 'warning'}
                        label={t(suggestion.transfer_type === 'internal' ? 'Intern' : 'External')}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{suggestion.source.unite_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {suggestion.source.company_name} / {suggestion.source.job_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{suggestion.destination.unite_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {suggestion.destination.company_name} / {suggestion.destination.job_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void handleValidateSuggestion(suggestion)}
                        disabled={validatingSuggestionId === suggestion.assignment_id}
                      >
                        {validatingSuggestionId === suggestion.assignment_id ? t('Validating...') : t('Validate transfer')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!loadingSuggestions && suggestions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                      {t('No suggestions available for the selected year.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

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