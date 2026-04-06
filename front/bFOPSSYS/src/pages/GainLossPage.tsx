import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import { useI18n } from '../i18n/translator';

type GainOrLossItem = {
  id: number;
  person_name: string;
  unite_name: string;
  company_name: string;
  created_at: string;
};

type Company = {
  id: number;
  name: string;
  unite: number | null;
};

type Unite = {
  id: number;
  name: string;
};

type TransferItem = {
  id: number;
  person_name: string;
  from_unite: number | null;
  to_unite: number | null;
  from_unite_name: string;
  to_unite_name: string;
  from_company_name: string;
  to_company_name: string;
  transfer_date: string;
  reason: string;
};

const asList = (payload: any) => payload?.results || payload || [];
const normalizeId = (value: any) => (value === null || value === undefined || value === '' ? '' : String(value));

export default function GainLossPage() {
  const { t } = useI18n();
  const [gains, setGains] = useState<GainOrLossItem[]>([]);
  const [losses, setLosses] = useState<GainOrLossItem[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    fetch('/api/unites/').then(res => res.json()).then(data => setUnites(asList(data)));
    fetch('/api/companies/').then(res => res.json()).then(data => setCompanies(asList(data)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedUnite) params.set('unite', selectedUnite);
    if (selectedCompany) params.set('company', selectedCompany);

    const query = params.toString();
    const querySuffix = query ? `?${query}` : '';

    fetch(`/api/gains/${querySuffix}`).then(res => res.json()).then(data => setGains(asList(data)));
    fetch(`/api/losses/${querySuffix}`).then(res => res.json()).then(data => setLosses(asList(data)));
    fetch('/api/transfers/?ordering=-transfer_date').then(res => res.json()).then(data => setTransfers(asList(data)));
  }, [selectedUnite, selectedCompany]);

  const filteredCompanies = selectedUnite 
    ? companies.filter((c) => {
        const uniteId = (c as any).unite ?? (c as any).unite_id ?? (c as any).unite?.id;
        return normalizeId(uniteId) === selectedUnite;
      })
    : companies;

  useEffect(() => {
    if (selectedCompany && !filteredCompanies.some((c) => normalizeId(c.id) === selectedCompany)) {
      setSelectedCompany('');
    }
  }, [selectedCompany, filteredCompanies]);

  const selectedCompanyName = selectedCompany
    ? filteredCompanies.find((c) => normalizeId(c.id) === selectedCompany)?.name
      || companies.find((c) => normalizeId(c.id) === selectedCompany)?.name
      || ''
    : '';

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesUnite = !selectedUnite
      || normalizeId(transfer.from_unite) === selectedUnite
      || normalizeId(transfer.to_unite) === selectedUnite;

    const matchesCompany = !selectedCompanyName
      || transfer.from_company_name === selectedCompanyName
      || transfer.to_company_name === selectedCompanyName;

    return matchesUnite && matchesCompany;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 4 }}>
        {t('Gains & Losses Dashboard')}
      </Typography>
      
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>{t('Filter by Unite')}</InputLabel>
            <Select 
              value={selectedUnite} 
              onChange={(e) => {
                setSelectedUnite(normalizeId(e.target.value));
                setSelectedCompany('');
              }}
            >
              <MenuItem value=""><em>{t('All Unites')}</em></MenuItem>
              {unites.map((u: any) => <MenuItem key={u.id} value={normalizeId(u.id)}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>{t('Filter by Company')}</InputLabel>
            <Select 
              value={selectedCompany} 
              onChange={(e) => setSelectedCompany(normalizeId(e.target.value))}
              disabled={filteredCompanies.length === 0}
            >
              <MenuItem value=""><em>{t('All Companies')}</em></MenuItem>
              {filteredCompanies.map((c: any) => <MenuItem key={c.id} value={normalizeId(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Styled to match the others, but with a green accent bar at the top */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="h6" fontWeight="medium" color="success.main" mb={2}>
              {t('Gains (New Hires & Transfers In)')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Person')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Type')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Company')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gains.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell>{g.person_name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t('Transfer In')} color="success" variant="outlined" />
                    </TableCell>
                    <TableCell>{g.unite_name}</TableCell>
                    <TableCell>{g.company_name}</TableCell>
                    <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {/* Styled to match the others, but with a red accent bar at the top */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%', borderTop: '4px solid', borderColor: 'error.main' }}>
            <Typography variant="h6" fontWeight="medium" color="error.main" mb={2}>
              {t('Losses (Deletions & Transfers Out)')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Person')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Type')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Company')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {losses.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.person_name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t('Transfer Out')} color="error" variant="outlined" />
                    </TableCell>
                    <TableCell>{l.unite_name}</TableCell>
                    <TableCell>{l.company_name}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ mt: 3, p: 3, borderRadius: 2, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" fontWeight="medium" color="primary.main" mb={2}>
          {t('Transfer Movements (from_unite to to_unite)')}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('Person')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('From Unite')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('From Company')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('To Unite')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('To Company')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('Date')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('Reason')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransfers.map((transfer) => (
              <TableRow key={transfer.id} hover>
                <TableCell>{transfer.person_name}</TableCell>
                <TableCell>{transfer.from_unite_name || '-'}</TableCell>
                <TableCell>{transfer.from_company_name || '-'}</TableCell>
                <TableCell>{transfer.to_unite_name || '-'}</TableCell>
                <TableCell>{transfer.to_company_name || '-'}</TableCell>
                <TableCell>{new Date(transfer.transfer_date).toLocaleDateString()}</TableCell>
                <TableCell>{transfer.reason || '-'}</TableCell>
              </TableRow>
            ))}
            {filteredTransfers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  {t('No transfers found for current filters.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}