import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { Delete, People, CheckCircle, Cancel } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    setDeleting(userId);
    
    try {
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    setTogglingStatus(userId);
    
    try {
      await axios.patch(
        `${API}/users/${userId}/status?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }} data-testid="users-page">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Management
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Users can only sign up through the app. Manage existing users below.
        </Typography>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        /* Empty State */
        <Paper
          elevation={0}
          data-testid="empty-state"
          sx={{
            p: 8,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              bgcolor: 'rgba(249, 185, 112, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <People sx={{ fontSize: 40, color: '#EF5C1E' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No users yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
            Users will appear here once they sign up through the app.
          </Typography>
        </Paper>
      ) : (
        /* Users Table */
        <TableContainer
          component={Paper}
          elevation={0}
          data-testid="users-table-container"
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Device Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Run Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Password</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Secret Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.user_id}
                  data-testid={`user-row-${user.user_id}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{user.user_id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell sx={{ color: user.device_number ? 'text.primary' : 'text.disabled' }}>
                    {user.device_number || '—'}
                  </TableCell>
                  <TableCell sx={{ color: user.last_run_location ? 'text.primary' : 'text.disabled' }}>
                    {user.last_run_location || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.password}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.secret_code}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      icon={user.status === 'Active' ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 2,
                        bgcolor: user.status === 'Active' 
                          ? 'rgba(76, 175, 80, 0.15)' 
                          : 'rgba(158, 158, 158, 0.15)',
                        color: user.status === 'Active' ? '#2e7d32' : '#757575',
                        fontWeight: 500,
                        '& .MuiChip-icon': {
                          color: user.status === 'Active' ? '#2e7d32' : '#757575',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={user.status === 'Active' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleStatus(user.user_id, user.status)}
                          disabled={togglingStatus === user.user_id}
                          data-testid={`toggle-status-${user.user_id}`}
                          sx={{
                            color: user.status === 'Active' ? '#757575' : '#2e7d32',
                            '&:hover': { 
                              bgcolor: user.status === 'Active' 
                                ? 'rgba(158, 158, 158, 0.1)' 
                                : 'rgba(76, 175, 80, 0.1)' 
                            },
                          }}
                        >
                          {togglingStatus === user.user_id ? (
                            <CircularProgress size={20} />
                          ) : user.status === 'Active' ? (
                            <Cancel fontSize="small" />
                          ) : (
                            <CheckCircle fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.user_id, user.name)}
                          disabled={deleting === user.user_id}
                          data-testid={`delete-user-${user.user_id}`}
                          sx={{
                            color: 'error.main',
                            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' },
                          }}
                        >
                          {deleting === user.user_id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Delete fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Total count */}
      {!loading && users.length > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
          data-testid="users-total-count"
        >
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};
