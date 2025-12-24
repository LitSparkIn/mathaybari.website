import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

  // Activation modal state
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deviceNumber, setDeviceNumber] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data.users);
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

  const handleToggleStatus = (user) => {
    if (user.status === 'Active') {
      // Deactivate directly
      updateStatus(user.user_id, 'Inactive');
    } else {
      // Show modal for activation
      setSelectedUser(user);
      setDeviceNumber(user.device_number || '');
      setActivateDialogOpen(true);
    }
  };

  const updateStatus = async (userId, status, deviceNum = null) => {
    setTogglingStatus(userId);
    
    try {
      let url = `${API}/users/${userId}/status?status=${status}`;
      if (deviceNum) {
        url += `&device_number=${encodeURIComponent(deviceNum)}`;
      }
      
      const response = await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success(`User status updated to ${status}`);
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to update user status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleActivateUser = async () => {
    if (!deviceNumber.trim()) {
      toast.error('Device number is required');
      return;
    }

    setActivating(true);
    
    try {
      const url = `${API}/users/${selectedUser.user_id}/status?status=Active&device_number=${encodeURIComponent(deviceNumber)}`;
      
      const response = await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('User activated successfully');
        setActivateDialogOpen(false);
        setSelectedUser(null);
        setDeviceNumber('');
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to activate user');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to activate user');
    } finally {
      setActivating(false);
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
                          onClick={() => handleToggleStatus(user)}
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

      {/* Activate User Dialog */}
      <Dialog
        open={activateDialogOpen}
        onClose={() => {
          setActivateDialogOpen(false);
          setSelectedUser(null);
          setDeviceNumber('');
        }}
        maxWidth="sm"
        fullWidth
        data-testid="activate-user-dialog"
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Activate User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the device number to activate <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          <TextField
            fullWidth
            label="Device Number"
            value={deviceNumber}
            onChange={(e) => setDeviceNumber(e.target.value)}
            placeholder="Enter device number"
            disabled={activating}
            required
            data-testid="activate-device-number-input"
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setActivateDialogOpen(false);
              setSelectedUser(null);
              setDeviceNumber('');
            }}
            disabled={activating}
            data-testid="activate-cancel-button"
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivateUser}
            disabled={activating || !deviceNumber.trim()}
            data-testid="activate-submit-button"
            sx={{
              borderRadius: 3,
              bgcolor: '#4caf50',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#388e3c',
              },
            }}
          >
            {activating ? <CircularProgress size={24} color="inherit" /> : 'Activate User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
