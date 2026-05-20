import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Table, TableHead, TableRow, TableCell, TableBody, Typography, Tooltip,
  Select, MenuItem, Checkbox, ListItemText, Box, Chip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import * as XLSX from 'xlsx';
import { bulkCreatePersons } from '../api-persons';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import { useI18n } from '../i18n/translator';
import '../styles/persons.css';

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  matricule: string;
  national_id?: string;
  contract_type: 'actif' | 'contractuel' | 'reserve';
  grade: number | null;
  grade_name?: string;
  unite: number | null;
  unite_name?: string;
  company: number | null;
  company_name?: string;
  job: number | null;
  job_name?: string;
}

const PersonsPage = () => {
  const { t, language } = useI18n();
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedGradesFilter, setSelectedGradesFilter] = useState<number[]>([]);
  const [editing, setEditing] = useState<Person | null>(null);
  
  const initialFormState = { 
    first_name: '', last_name: '', matricule: '', 
    contract_type: 'actif', grade: '', unite: '', company: ''
  };
  const [form, setForm] = useState(initialFormState);
  
  const [grades, setGrades] = useState<any[]>([]);
  const [unites, setUnites] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/grades/').then(res => setGrades(res.data.results || res.data));
    axios.get('/api/unites/').then(res => setUnites(res.data.results || res.data));
    axios.get('/api/companies/').then(res => setCompanies(res.data.results || res.data));
  }, []);

  const fetchPersons = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/persons/', { params });
    const rows = res.data.results || res.data;
    const normalized = rows.map((row: any) => ({
      ...row,
      matricule: row.matricule || row.national_id || '',
    }));
    setPersons(normalized);
  };
  
  useEffect(() => { fetchPersons(); }, [filter]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      const requiredColumns = ['first_name', 'last_name', 'matricule', 'contract_type', 'grade', 'unite', 'company'];
      if (json.length > 0) {
        const firstRowKeys = Object.keys(json[0]).map((k) => String(k).trim());
        const missing = requiredColumns.filter((col) => !firstRowKeys.includes(col));
        if (missing.length > 0) {
          alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + `Missing required columns: ${missing.join(', ')}`);
          return;
        }
      }
      
      const records: any[] = [];
      const errors: string[] = [];

      json.forEach((row, index) => {
        const rowNum = index + 2;

        const findId = (list: any[], val: any, nameField = 'name') => {
          if (val == null || val === '') return null;
          const normalize = (str: any) => String(str).replace(/\s+/g, '').toLowerCase();
          const found = list.find(item => 
            normalize(item[nameField]) === normalize(val) || 
            String(item.id) === String(val)
          );
          return found ? found.id : undefined;
        };
        
        // Safely extract values case-insensitively, even if headers have spaces
        const getVal = (possibleKeys: string[]) => {
          const keys = Object.keys(row);
          for (const k of keys) {
            if (possibleKeys.includes(k.trim().toLowerCase())) {
              return row[k];
            }
          }
          return '';
        };

        const rawGrade = getVal(['grade']);
        const rawUnite = getVal(['unite']);
        const rawCompany = getVal(['company']);
        const rawFirstName = getVal(['first_name', 'firstname']);
        const rawLastName = getVal(['last_name', 'lastname']);
        const rawMatricule = getVal(['matricule', 'national_id', 'nationalid']);
        const rawContractType = getVal(['contract_type', 'contracttype']);

        const gradeId = findId(grades, rawGrade);
        const uniteId = findId(unites, rawUnite);
        const companyId = findId(companies, rawCompany);

        if (gradeId === undefined) errors.push(`Row ${rowNum}: Grade "${rawGrade}" not found.`);
        if (uniteId === undefined) errors.push(`Row ${rowNum}: Unite "${rawUnite}" not found.`);
        if (companyId === undefined) errors.push(`Row ${rowNum}: Company "${rawCompany}" not found.`);

        records.push({
          first_name: String(rawFirstName).trim(),
          last_name: String(rawLastName).trim(),
          matricule: String(rawMatricule).replace(/\s+/g, ''),
          contract_type: String(rawContractType || 'actif').trim(),
          grade: gradeId || null,
          unite: uniteId || null,
          company: companyId || null,
        });
      });

      if (errors.length > 0) {
        alert(t('Upload aborted. Please fix the following errors in your Excel file:\n\n') + errors.join('\n'));
        return;
      }
      
      await bulkCreatePersons(records);
      alert(t('Bulk upload successful!'));
      fetchPersons();
    } catch (err: any) {
      alert(t('Bulk upload failed:') + ' ' + (err?.message || t('Unknown error')));
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      grade: form.grade === '' ? null : form.grade,
      unite: form.unite === '' ? null : form.unite,
      company: form.company === '' ? null : form.company,
    };

    if (editing) {
      await axios.put(`/api/persons/${editing.id}/`, payload);
      setEditing(null);
    } else {
      await axios.post('/api/persons/', payload);
    }
    
    setForm(initialFormState);
    fetchPersons();
  };

  const handleEdit = (person: Person) => {
    setEditing(person);
    setForm({
      first_name: person.first_name,
      last_name: person.last_name,
      matricule: person.matricule || person.national_id || '',
      contract_type: person.contract_type || 'actif',
      grade: person.grade ? String(person.grade) : '',
      unite: person.unite ? String(person.unite) : '',
      company: person.company ? String(person.company) : '',
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      await axios.delete(`/api/persons/${id}/`);
      fetchPersons();
    }
  };

  const filteredCompanies = form.unite ? companies.filter(c => String(c.unite) === String(form.unite)) : companies;

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const getContractTypeLabel = (value: string) => {
    if (value === 'actif') return t('Active');
    if (value === 'contractuel') return t('Contractual');
    if (value === 'reserve') return t('Reserve');
    return t(value || '-');
  };

  const getWorkModeLabel = (value: string) => {
    if (value === 'actif') return t('Full-Time');
    if (value === 'contractuel') return t('Freelance');
    if (value === 'reserve') return t('Reserve');
    return t('-');
  };

  const getContractTypeColor = (value: string) => {
    if (value === 'actif') return '#7E57C2'; // Purple
    if (value === 'contractuel') return '#26A69A'; // Teal
    if (value === 'reserve') return '#5C6BC0'; // Indigo (bright but not shiny)
    return '#757575'; // Grey fallback
  };

  const [viewPerson, setViewPerson] = useState<Person | null>(null);
  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)),
    [grades]
  );
  const sortedPersons = useMemo(() => {
    const gradeRatingByName = new Map<string, number>();
    grades.forEach((g) => {
      if (g?.name != null) {
        gradeRatingByName.set(String(g.name).trim().toLowerCase(), Number(g.rating) || 0);
      }
    });

    const withPriority = [...persons];
    withPriority.sort((a, b) => {
      const aRating = a.grade_name ? (gradeRatingByName.get(String(a.grade_name).trim().toLowerCase()) ?? -1) : -1;
      const bRating = b.grade_name ? (gradeRatingByName.get(String(b.grade_name).trim().toLowerCase()) ?? -1) : -1;
      if (aRating !== bRating) return bRating - aRating;
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    });

    return withPriority;
  }, [persons, grades]);

  const fullyFilteredPersons = useMemo(() => {
    if (selectedGradesFilter.length === 0) return sortedPersons;
    return sortedPersons.filter(p => p.grade !== null && selectedGradesFilter.includes(p.grade));
  }, [sortedPersons, selectedGradesFilter]);

  const gradeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (selectedGradesFilter.length > 0) {
      selectedGradesFilter.forEach(gId => counts[gId] = 0);
      sortedPersons.forEach(p => {
        if (p.grade !== null && selectedGradesFilter.includes(p.grade)) {
          counts[p.grade] = (counts[p.grade] || 0) + 1;
        }
      });
    }
    return counts;
  }, [sortedPersons, selectedGradesFilter]);

  const totalFilteredSum = useMemo(() => {
    return Object.values(gradeCounts).reduce((a, b) => a + b, 0);
  }, [gradeCounts]);

  const allGradesSelected = sortedGrades.length > 0 && selectedGradesFilter.length === sortedGrades.length;

  const handleGradeFilterChange = (event: SelectChangeEvent<number[]>) => {
    const { target: { value } } = event;
    const valueArray = typeof value === 'string' ? value.split(',') : value;
    
    if (valueArray.some(v => String(v) === '__select_all__')) {
      handleToggleSelectAllGrades();
      return;
    }
    
    setSelectedGradesFilter((valueArray as any[]).map(Number));
  };

  const handleToggleSelectAllGrades = () => {
    setSelectedGradesFilter(allGradesSelected ? [] : sortedGrades.map((grade) => grade.id));
  };

  const handleExportExcel = () => {
    const isArabic = language === 'ar';
    const headers = isArabic
      ? ['اللقب', 'الاسم', 'رقم التسجيل', 'الرتبة', 'السرية', 'الوحدة']
      : ['First Name', 'Last Name', 'Matricule', 'Grade', 'Company', 'Unite'];

    // We use fullyFilteredPersons if there is a subset, otherwise fall back to searching text filtered
    let listToExport = fullyFilteredPersons;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      listToExport = listToExport.filter(p => 
        p.first_name.toLowerCase().includes(lowerFilter) ||
        p.last_name.toLowerCase().includes(lowerFilter) ||
        p.matricule.toLowerCase().includes(lowerFilter)
      );
    }

    const dataToExport = listToExport.map(p => {
      if (isArabic) {
         return {
           'اللقب': p.last_name,
           'الاسم': p.first_name,
           'رقم التسجيل': p.matricule,
           'الرتبة': p.grade_name || '-',
           'السرية': p.company_name || '-',
           'الوحدة': p.unite_name || '-'
         };
      } else {
         return {
           'First Name': p.first_name,
           'Last Name': p.last_name,
           'Matricule': p.matricule,
           'Grade': p.grade_name || '-',
           'Company': p.company_name || '-',
           'Unite': p.unite_name || '-'
         };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('Personnel Registry'));
    XLSX.writeFile(workbook, `Personnel_Registry_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="persons-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Talent Management')}</h1>
          <p>{t('Review and manage individual records for the company.')}</p>
        </div>
        <div className="header-actions">
          <input 
            type="file" 
            accept=".xlsx,.xls" 
            ref={fileInputRef} 
            onChange={handleExcelUpload} 
            style={{ display: 'none' }} 
          />
          <Tooltip title={t('View Expected Excel Format')}>
            <button className="btn btn-outline" onClick={() => setPreviewOpen(true)} style={{ padding: '8px 12px' }}>
              <InfoIcon fontSize="small" />
            </button>
          </Tooltip>
          <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={bulkUploading}>
            <UploadFileIcon fontSize="small" />
            {bulkUploading ? t('Uploading...') : t('Bulk Upload')}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialFormState); }}>
            <PersonAddIcon fontSize="small" />
            {t('Add New Person')}
          </button>
        </div>
      </header>

      <div className="content-grid">
        <div className="left-column">
          <div className="card">
            <div className="card-header-flex">
              <div className="card-icon"><DescriptionIcon fontSize="small" /></div>
              <h2 className="card-title">{editing ? t('Edit Record') : t('New Record')}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('First Name')}</label>
                  <input type="text" className="form-input" placeholder="Jane" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Last Name')}</label>
                  <input type="text" className="form-input" placeholder="Doe" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('Matricule')}</label>
                <input type="text" className="form-input" placeholder="MAT-0001" value={form.matricule} onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">{t('Type of Contract')}</label>
                <select className="form-select" value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value as 'actif' | 'contractuel' | 'reserve' }))} required>
                  <option value="actif">{t('Active')} ({t('Permanent')})</option>
                  <option value="contractuel">{t('Contractual')} ({t('Temporary')})</option>
                  <option value="reserve">{t('Reserve')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('Grade')}</label>
                <div className="grades-toggle-container">
                  {sortedGrades.map(g => (
                    <div 
                      key={g.id} 
                      className={`grade-btn ${form.grade === String(g.id) ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, grade: String(g.id) }))}
                    >
                      {g.name}
                    </div>
                  ))}
                  <div className={`grade-btn ${form.grade === '' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, grade: '' }))}>
                    {t('None')}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">{t('Unite')}</label>
                <select className="form-select" value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value, company: '', job: '' }))}>
                  <option value="">{t('Select Unite...')}</option>
                  {unites.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('Company')}</label>
                  <select className="form-select" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} disabled={!form.unite && filteredCompanies.length === 0}>
                    <option value="">{t('Select...')}</option>
                    {filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full-width">
                {editing ? t('Update Identity') : t('Create Identity')}
              </button>
              {editing && (
                 <button type="button" className="btn btn-outline btn-full-width" style={{ marginTop: '8px'}} onClick={() => { setEditing(null); setForm(initialFormState); }}>
                   {t('Cancel Edit')}
                 </button>
              )}
            </form>
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <div className="table-header" style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <h2 className="card-title">{t('Personnel Registry')}</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
                <Tooltip title={t('Export to Excel')}>
                  <button className="btn btn-outline" onClick={handleExportExcel} style={{ padding: '8px 12px' }}>
                    <DownloadIcon fontSize="small" />
                  </button>
                </Tooltip>
                <Select
                  multiple
                  displayEmpty
                  value={selectedGradesFilter}
                  onChange={handleGradeFilterChange}
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <em>{t('Filter by Grades')}</em>;
                    }
                    if (allGradesSelected) {
                      return t('All Grades');
                    }
                    return t('Grades Selected') + ` (${selected.length})`;
                  }}
                  size="small"
                  sx={{ minWidth: 200, bgcolor: 'white' }}
                >
                  <MenuItem
                    value="__select_all__"
                    disabled={sortedGrades.length === 0}
                    sx={{ fontWeight: 600 }}
                  >
                    <Checkbox checked={allGradesSelected} indeterminate={selectedGradesFilter.length > 0 && !allGradesSelected} />
                    {allGradesSelected ? t('Clear Grades') : t('Select All Grades')}
                  </MenuItem>
                  {sortedGrades.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      <Checkbox checked={selectedGradesFilter.indexOf(g.id) > -1} />
                      <ListItemText primary={g.name} />
                    </MenuItem>
                  ))}
                </Select>
                <div className="search-input-wrapper" style={{ margin: 0 }}>
                  <SearchIcon className="search-icon" fontSize="small" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder={t('Search employee record...')} 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {selectedGradesFilter.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, p: 1, bgcolor: '#f9fafb', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mr: 1 }}>
                  {t('Filtered Summary')}:
                </Typography>
                {allGradesSelected ? (
                  <Chip
                    label={t('All Grades')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ) : (
                  selectedGradesFilter.map(gId => {
                    const gradeObj = grades.find(g => g.id === gId);
                    const name = gradeObj ? gradeObj.name : `#${gId}`;
                    return (
                      <Chip 
                        key={gId} 
                        label={`${name}: ${gradeCounts[gId]}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    );
                  })
                )}
                <Chip 
                  label={`${t('Total')}: ${totalFilteredSum}`} 
                  size="small" 
                  color="primary" 
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}

            <table className="custom-table">
              <thead>
                <tr>
                  <th>{t('Employee')}</th>
                  <th>{t('Matricule')}</th>
                  <th>{t('Grade')}</th>
                  <th>{t('Unit / Company')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {fullyFilteredPersons.map(person => (
                  <tr key={person.id} onClick={() => setViewPerson(person)} style={{cursor: 'pointer'}}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {getInitials(person.first_name, person.last_name)}
                        </div>
                        <div className="employee-info">
                          <h4>{person.first_name} {person.last_name}</h4>
                          {person.job_name && <p>{person.job_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td>{person.matricule}</td>
                    <td>{person.grade_name || '-'}</td>
                    <td>
                      <div className="employee-info">
                        <h4>{person.company_name || t('No Company')}</h4>
                        <p>{person.unite_name || '-'}</p>
                      </div>
                    </td>
                    <td>
                      <Chip 
                        label={person.contract_type} 
                        size="small"
                        sx={{ 
                          backgroundColor: getContractTypeColor(person.contract_type), 
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize' 
                        }} 
                      />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="action-icons">
                        <button className="action-btn edit" onClick={() => { setViewPerson(null); handleEdit(person); }}><EditIcon fontSize="small" /></button>
                        <button className="action-btn delete" onClick={() => { setViewPerson(null); handleDelete(person.id); }}><DeleteIcon fontSize="small" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {fullyFilteredPersons.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      {t('No employee records found.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('Expected Excel Format for Persons')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" gutterBottom>
            {t('Ensure your Excel file has a heading row matching these exact column names. Additional columns will be ignored.')}
          </Typography>
          <div style={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600, border: '1px solid #ddd', mt: 2 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>first_name</strong></TableCell>
                  <TableCell><strong>last_name</strong></TableCell>
                  <TableCell><strong>matricule</strong></TableCell>
                  <TableCell><strong>contract_type</strong></TableCell>
                  <TableCell><strong>grade</strong></TableCell>
                  <TableCell><strong>unite</strong></TableCell>
                  <TableCell><strong>company</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>John</TableCell>
                  <TableCell>Doe</TableCell>
                  <TableCell>N12345</TableCell>
                  <TableCell>actif</TableCell>
                  <TableCell>capitaine</TableCell>
                  <TableCell>Bataillon</TableCell>
                  <TableCell>Compagnie 1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Jane</TableCell>
                  <TableCell>Smith</TableCell>
                  <TableCell>N67890</TableCell>
                  <TableCell>contractuel</TableCell>
                  <TableCell>commandant</TableCell>
                  <TableCell>Regiment</TableCell>
                  <TableCell>Compagnie HQ</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewPerson} onClose={() => setViewPerson(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Person Details')}</DialogTitle>
        <DialogContent dividers>
          {viewPerson && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold'
                }}>
                  {getInitials(viewPerson.first_name, viewPerson.last_name)}
                </div>
                <div>
                  <Typography variant="h6">{viewPerson.first_name} {viewPerson.last_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewPerson.job_name || t('No Job')}</Typography>
                </div>
              </div>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>{t('Matricule')}</strong></TableCell>
                    <TableCell>{viewPerson.matricule}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>{t('Contract')}</strong></TableCell>
                    <TableCell>{getContractTypeLabel(viewPerson.contract_type)} - {getWorkModeLabel(viewPerson.contract_type)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>{t('Grade')}</strong></TableCell>
                    <TableCell>{viewPerson.grade_name || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>{t('Unite')}</strong></TableCell>
                    <TableCell>{viewPerson.unite_name || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row"><strong>{t('Company')}</strong></TableCell>
                    <TableCell>{viewPerson.company_name || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewPerson(null)}>{t('Close')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PersonsPage;