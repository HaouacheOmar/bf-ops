import React, { useState, useEffect } from 'react';
import { api } from '../api'; // Swapped out createGrade to use api directly
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import '../styles/layout.css';

const GradeCreatePage: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchGrades = async () => {
    const res = await api.get('/grades/');
    setGrades(res.data.results || res.data);
  };
  
  useEffect(() => { fetchGrades(); }, []);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        // OPTIMISTIC UPDATE
        const res = await api.put(`/grades/${editing.id}/`, form);
        setGrades(grades.map(g => g.id === editing.id ? res.data : g));
      } else {
        // OPTIMISTIC UPDATE
        const res = await api.post('/grades/', form);
        setGrades([...grades, res.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error saving grade');
    }
  };

  const handleEdit = (grade: any) => {
    setEditing(grade);
    setForm({ name: grade.name, code: grade.code });
    setError('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("Delete this grade?")) {
      await api.delete(`/grades/${id}/`);
      // OPTIMISTIC UPDATE
      setGrades(grades.filter(g => g.id !== id));
    }
  };

  return (
    <div className="assignments-page-container">
      <header className="page-header">
        <div className="page-title">
          <h1>Employee Grades</h1>
          <span className="breadcrumb">Settings &gt; <span className="breadcrumb-active">Grades Dictionary</span></span>
        </div>
      </header>

      <div className="top-grid" style={{gridTemplateColumns: '300px'}}>
        <div className="card">
          <h2 className="card-title">New Grade</h2>
          <p className="card-subtitle">Define a new employee seniority grade.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={openNewForm}>
            <StarIcon fontSize="small" /> Add Grade
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-header-row">
          <h2 className="card-title" style={{marginBottom: '4px'}}>Grades Dictionary</h2>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Grade Name</th>
              <th>Reference Code</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade.id}>
                <td><strong>{grade.name}</strong></td>
                <td><span className="status-pill blue">{grade.code}</span></td>
                <td>
                  <div className="action-icons">
                    <button className="action-btn edit" onClick={() => handleEdit(grade)}><EditIcon fontSize="small" /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(grade.id)}><DeleteIcon fontSize="small" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginTop: 0, marginBottom: '24px'}}>{editing ? 'Edit Grade' : 'Create Grade'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Grade Name</label>
                <input type="text" className="filter-select" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Grade Code</label>
                <input type="text" className="filter-select" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} required />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default GradeCreatePage;