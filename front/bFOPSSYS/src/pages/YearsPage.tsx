import { useEffect, useState } from 'react';
import axios from 'axios';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import { useI18n } from '../i18n/translator';
import '../styles/layout.css';

interface Year {
  id: number;
  year: number;
  total_quota: number;
  is_closed: boolean;
  created_at: string;
}

const YearsPage = () => {
  const { t } = useI18n();
  const [years, setYears] = useState<Year[]>([]);
  const [filter, setFilter] = useState('');
  const readOnlyNotice = t('Fiscal years are now generated automatically from assignments and quotas.');

  const fetchYears = async () => {
    const params = filter ? { search: filter } : undefined;
    const res = await axios.get('/api/years/', { params });
    setYears(res.data.results || res.data);
  };
  
  useEffect(() => { fetchYears(); }, [filter]);

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>{t('Fiscal Years')}</h1>
          <span className="breadcrumb">{t('Settings')} &gt; <span className="breadcrumb-active">{t('Years Configuration')}</span></span>
        </div>
        <div className="search-bar-wrapper">
          <SearchIcon style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af', fontSize: '18px' }} />
          <input type="text" placeholder={t('Search years...')} value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </header>

      <div className="top-grid">
        <div className="card">
          <h2 className="card-title">{t('Fiscal Years')}</h2>
          <p className="card-subtitle">{readOnlyNotice}</p>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled>
            <CalendarTodayIcon fontSize="small" /> {t('Read-only')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <div>
            <h2 className="card-title" style={{marginBottom: '4px'}}>{t('Year Registries')}</h2>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>{t('Year')}</th>
              <th>{t('Total Quota')}</th>
              <th>{t('Status')}</th>
              <th>{t('Created At')}</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year.id}>
                <td><strong>{year.year}</strong></td>
                <td>{year.total_quota ?? '-'}</td>
                <td>
                  <span className={`status-pill ${year.is_closed ? 'intern' : 'permanent'}`}>
                    {year.is_closed ? t('Closed') : t('Active')}
                  </span>
                </td>
                <td>{year.created_at ? new Date(year.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default YearsPage;