import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    createManagedAccount,
    deleteManagedAccount,
    getManagedAccounts,
    updateManagedAccountPassword,
} from '../api';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { useI18n } from '../i18n/translator';
import { useAuth } from '../context/AuthContext';

type ManagedAccount = {
    id: number;
    username: string;
    role: 'admin' | 'viewer';
};

const UsersManagementPage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useI18n();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [loading, setLoading] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
    const [passwordByUserId, setPasswordByUserId] = useState<Record<number, string>>({});

    const initialForm: { username: string; password: string; role: 'admin' | 'viewer' } = {
        username: '',
        password: '',
        role: 'viewer',
    };
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        void loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const res = await getManagedAccounts();
            setAccounts(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.detail || t('Failed to load accounts'));
        } finally {
            setLoadingAccounts(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'role') {
            setForm({ ...form, role: value as 'admin' | 'viewer' });
            return;
        }
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await createManagedAccount(form);
            setSuccess(t('User created successfully'));
            setForm(initialForm);
            await loadAccounts();
        } catch (err: any) {
            const data = err?.response?.data;
            if (data && typeof data === 'object') {
                const details = Object.entries(data)
                    .map(([key, value]) => {
                        const message = Array.isArray(value) ? value.join(', ') : String(value);
                        return `${key}: ${message}`;
                    })
                    .join(' | ');
                setError(details || t('Failed to create user'));
            } else {
                setError(err?.response?.data?.detail || t('Failed to create user'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordInputChange = (userId: number, value: string) => {
        setPasswordByUserId((prev) => ({ ...prev, [userId]: value }));
    };

    const handlePasswordUpdate = async (targetUser: ManagedAccount) => {
        const password = passwordByUserId[targetUser.id]?.trim();
        if (!password) {
            setError(t('Please provide a new password first'));
            return;
        }

        setError('');
        setSuccess('');

        try {
            await updateManagedAccountPassword(targetUser.id, password);
            setSuccess(t('Password updated successfully'));
            setPasswordByUserId((prev) => ({ ...prev, [targetUser.id]: '' }));
        } catch (err: any) {
            const data = err?.response?.data;
            if (data && typeof data === 'object') {
                const details = Object.entries(data)
                    .map(([key, value]) => {
                        const message = Array.isArray(value) ? value.join(', ') : String(value);
                        return `${key}: ${message}`;
                    })
                    .join(' | ');
                setError(details || t('Failed to update password'));
            } else {
                setError(err?.response?.data?.detail || t('Failed to update password'));
            }
        }
    };

    const handleDelete = async (targetUser: ManagedAccount) => {
        const confirmed = window.confirm(`${t('Delete account')} ${targetUser.username}?`);
        if (!confirmed) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteManagedAccount(targetUser.id);
            setSuccess(t('Account deleted successfully'));
            await loadAccounts();
        } catch (err: any) {
            setError(err?.response?.data?.detail || t('Failed to delete account'));
        }
    };

    if (user?.role !== 'admin') {
        return <Typography sx={{ p: 3 }}>{t('Access Denied')}</Typography>;
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2.5 }}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                }}
            >
                <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ManageAccountsOutlinedIcon color="primary" />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {t('Users Management')}
                        </Typography>
                    </Box>

                    <Typography color="text.secondary">
                        {t('Create admin or guest accounts and manage existing account passwords')}
                    </Typography>

                    {success && <Alert severity="success">{t(success)}</Alert>}
                    {error && <Alert severity="error">{t(error)}</Alert>}

                    <Stack
                        component="form"
                        onSubmit={handleSubmit}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1.5}
                        alignItems={{ xs: 'stretch', md: 'center' }}
                    >
                        <TextField
                            name="username"
                            label={t('Username')}
                            value={form.username}
                            onChange={handleChange}
                            required
                            fullWidth
                            size="small"
                            sx={{ minWidth: { md: 220 } }}
                        />
                        <TextField
                            name="password"
                            type="password"
                            label={t('Password')}
                            value={form.password}
                            onChange={handleChange}
                            required
                            fullWidth
                            size="small"
                            sx={{ minWidth: { md: 220 } }}
                        />
                        <TextField
                            select
                            SelectProps={{ native: true }}
                            name="role"
                            label={t('Role')}
                            value={form.role}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            sx={{ minWidth: { md: 180 } }}
                        >
                            <option value="viewer">{t('Guest')}</option>
                            <option value="admin">{t('Admin')}</option>
                        </TextField>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ px: 2.5, minWidth: { md: 150 }, width: { xs: '100%', md: 'auto' } }}
                        >
                            {loading ? <CircularProgress color="inherit" size={20} /> : t('Create User')}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                }}
            >
                <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('Manage Existing Accounts')}
                    </Typography>
                    <Divider />

                    {loadingAccounts ? (
                        <Typography color="text.secondary">{t('Loading accounts...')}</Typography>
                    ) : accounts.length === 0 ? (
                        <Typography color="text.secondary">{t('No accounts found')}</Typography>
                    ) : isMobile ? (
                        <Stack spacing={1.5}>
                            {accounts.map((account) => (
                                <Paper key={account.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                    <Stack spacing={1.2}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700 }} noWrap>
                                                    {account.username}
                                                </Typography>
                                                {account.id === user.id && <Chip size="small" label={t('You')} />}
                                            </Stack>
                                            <Chip
                                                size="small"
                                                color={account.role === 'admin' ? 'primary' : 'default'}
                                                label={account.role === 'admin' ? t('Admin') : t('Guest')}
                                            />
                                        </Stack>

                                        <TextField
                                            type="password"
                                            size="small"
                                            label={t('New Password')}
                                            value={passwordByUserId[account.id] || ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                handlePasswordInputChange(account.id, e.target.value)
                                            }
                                            fullWidth
                                        />

                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" onClick={() => handlePasswordUpdate(account)} fullWidth>
                                                {t('Update')}
                                            </Button>
                                            <Button
                                                color="error"
                                                variant="text"
                                                disabled={account.id === user.id}
                                                onClick={() => handleDelete(account)}
                                                fullWidth
                                            >
                                                {t('Delete')}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('Username')}</TableCell>
                                        <TableCell>{t('Role')}</TableCell>
                                        <TableCell>{t('Update Password')}</TableCell>
                                        <TableCell align="right">{t('Delete')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {accounts.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography>{account.username}</Typography>
                                                    {account.id === user.id && <Chip size="small" label={t('You')} />}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    color={account.role === 'admin' ? 'primary' : 'default'}
                                                    label={account.role === 'admin' ? t('Admin') : t('Guest')}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                                    <TextField
                                                        type="password"
                                                        size="small"
                                                        label={t('New Password')}
                                                        value={passwordByUserId[account.id] || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            handlePasswordInputChange(account.id, e.target.value)
                                                        }
                                                    />
                                                    <Button variant="outlined" onClick={() => handlePasswordUpdate(account)}>
                                                        {t('Update')}
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    color="error"
                                                    variant="text"
                                                    disabled={account.id === user.id}
                                                    onClick={() => handleDelete(account)}
                                                >
                                                    {t('Delete')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Stack>
            </Paper>
        </Box>
    );
};

export default UsersManagementPage;
