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
import { Delete, People, CheckCircle, Cancel, Key, Add, Close, Bluetooth, PhoneAndroid } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const { token } = useAuth();

  // Activation modal state
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [activating, setActivating] = useState(false);

  // Add Device ID modal state
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);
  const [addDeviceId, setAddDeviceId] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  // Add BLE ID modal state
  const [addBleDialogOpen, setAddBleDialogOpen] = useState(false);
  const [addBleId, setAddBleId] = useState('');
  const [addingBle, setAddingBle] = useState(false);

  // Deleting states
  const [deletingDeviceId, setDeletingDeviceId] = useState(null);
  const [deletingBleId, setDeletingBleId] = useState(null);

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
      updateStatus(user.user_id, 'Inactive');
    } else {
      setSelectedUser(user);
      setDeviceId('');
      setActivateDialogOpen(true);
    }
  };

  const updateStatus = async (userId, status) => {
    setTogglingStatus(userId);
    
    try {
      const response = await axios.patch(
        `${API}/users/${userId}/status?status=${status}`,
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
    if (!deviceId.trim()) {
      toast.error('Device ID is required');
      return;
    }

    setActivating(true);
    
    try {
      const url = `${API}/users/${selectedUser.user_id}/status?status=Active&device_id=${encodeURIComponent(deviceId)}`;
      
      const response = await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('User activated successfully');
        setActivateDialogOpen(false);
        setSelectedUser(null);
        setDeviceId('');
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

  // Device ID handlers
  const handleOpenAddDevice = (user) => {
    setSelectedUser(user);
    setAddDeviceId('');
    setAddDeviceDialogOpen(true);
  };

  const handleAddDeviceId = async () => {
    if (!addDeviceId.trim()) {
      toast.error('Device ID is required');
      return;
    }

    setAddingDevice(true);
    
    try {
      const response = await axios.post(
        `${API}/users/${selectedUser.user_id}/device-id?device_id=${encodeURIComponent(addDeviceId)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('Device ID added successfully');
        setAddDeviceDialogOpen(false);
        setSelectedUser(null);
        setAddDeviceId('');
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to add Device ID');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to add Device ID');
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDeviceId = async (userId, deviceIdToDelete) => {
    if (!window.confirm(`Delete Device ID ${deviceIdToDelete}?`)) {
      return;
    }

    setDeletingDeviceId(`${userId}-${deviceIdToDelete}`);
    
    try {
      const response = await axios.delete(
        `${API}/users/${userId}/device-id?device_id=${encodeURIComponent(deviceIdToDelete)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('Device ID deleted successfully');
        setUsers(prevUsers => prevUsers.map(user => {
          if (user.user_id === userId) {
            return {
              ...user,
              device_ids: user.device_ids.filter(id => id !== deviceIdToDelete)
            };
          }
          return user;
        }));
      } else {
        toast.error(response.data.data.message || 'Failed to delete Device ID');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to delete Device ID');
    } finally {
      setDeletingDeviceId(null);
    }
  };

  // BLE ID handlers
  const handleOpenAddBle = (user) => {
    setSelectedUser(user);
    setAddBleId('');
    setAddBleDialogOpen(true);
  };

  const handleAddBleId = async () => {
    if (!addBleId.trim()) {
      toast.error('BLE ID is required');
      return;
    }
    if (addBleId.length !== 8) {
      toast.error('BLE ID must be 8 characters');
      return;
    }

    setAddingBle(true);
    
    try {
      const response = await axios.post(
        `${API}/users/${selectedUser.user_id}/ble-id?ble_id=${encodeURIComponent(addBleId)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('BLE ID added successfully');
        setAddBleDialogOpen(false);
        setSelectedUser(null);
        setAddBleId('');
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to add BLE ID');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to add BLE ID');
    } finally {
      setAddingBle(false);
    }
  };

  const handleDeleteBleId = async (userId, bleIdToDelete) => {
    if (!window.confirm(`Delete BLE ID ${bleIdToDelete}?`)) {
      return;
    }

    setDeletingBleId(`${userId}-${bleIdToDelete}`);
    
    try {
      const response = await axios.delete(
        `${API}/users/${userId}/ble-id?ble_id=${encodeURIComponent(bleIdToDelete)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('BLE ID deleted successfully');
        setUsers(prevUsers => prevUsers.map(user => {
          if (user.user_id === userId) {
            return {
              ...user,
              ble_ids: user.ble_ids.filter(id => id !== bleIdToDelete)
            };
          }
          return user;
        }));
      } else {
        toast.error(response.data.data.message || 'Failed to delete BLE ID');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to delete BLE ID');
    } finally {
      setDeletingBleId(null);
    }
  };

  const handleResetPassword = async (userId, userName) => {
    if (!window.confirm(`Reset password for ${userName}? This will invalidate their current session.`)) {
      return;
    }

    setResettingPassword(userId);
    
    try {
      const response = await axios.patch(
        `${API}/users/${userId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success(`Password reset! New password: ${response.data.data.new_password}`);
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
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
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Device IDs</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>BLE IDs</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Run Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Password</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 200 }}>Actions</TableCell>
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
                  <TableCell>
                    {user.device_ids && user.device_ids.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.device_ids.map((devId, idx) => (
                          <Chip
                            key={idx}
                            label={devId}
                            size="small"
                            onDelete={() => handleDeleteDeviceId(user.user_id, devId)}
                            deleteIcon={
                              deletingDeviceId === `${user.user_id}-${devId}` ? (
                                <CircularProgress size={14} />
                              ) : (
                                <Close sx={{ fontSize: 14 }} />
                              )
                            }
                            disabled={deletingDeviceId === `${user.user_id}-${devId}`}
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-deleteIcon': { fontSize: 14 },
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.ble_ids && user.ble_ids.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.ble_ids.map((bleId, idx) => (
                          <Chip
                            key={idx}
                            label={bleId}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleDeleteBleId(user.user_id, bleId)}
                            deleteIcon={
                              deletingBleId === `${user.user_id}-${bleId}` ? (
                                <CircularProgress size={14} />
                              ) : (
                                <Close sx={{ fontSize: 14 }} />
                              )
                            }
                            disabled={deletingBleId === `${user.user_id}-${bleId}`}
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              height: 24,
                              '& .MuiChip-deleteIcon': { fontSize: 14 },
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: user.last_run_location ? 'text.primary' : 'text.disabled' }}>
                    {user.last_run_location || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{user.password}</TableCell>
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
                            <CircularProgress size={18} />
                          ) : user.status === 'Active' ? (
                            <Cancel fontSize="small" />
                          ) : (
                            <CheckCircle fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Device ID">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAddDevice(user)}
                          data-testid={`add-device-${user.user_id}`}
                          sx={{
                            color: '#9c27b0',
                            '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.1)' },
                          }}
                        >
                          <PhoneAndroid fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add BLE ID">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAddBle(user)}
                          data-testid={`add-ble-${user.user_id}`}
                          sx={{
                            color: '#00bcd4',
                            '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.1)' },
                          }}
                        >
                          <Bluetooth fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          onClick={() => handleResetPassword(user.user_id, user.name)}
                          disabled={resettingPassword === user.user_id}
                          data-testid={`reset-password-${user.user_id}`}
                          sx={{
                            color: '#F9B970',
                            '&:hover': { bgcolor: 'rgba(249, 185, 112, 0.1)' },
                          }}
                        >
                          {resettingPassword === user.user_id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <Key fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
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
                            <CircularProgress size={18} />
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
          setDeviceId('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Activate User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the Device ID (phone identifier) to activate <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          <TextField
            fullWidth
            label="Device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="Enter Device ID"
            disabled={activating}
            required
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setActivateDialogOpen(false);
              setSelectedUser(null);
              setDeviceId('');
            }}
            disabled={activating}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivateUser}
            disabled={activating || !deviceId.trim()}
            sx={{
              borderRadius: 3,
              bgcolor: '#4caf50',
              color: '#fff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#388e3c' },
            }}
          >
            {activating ? <CircularProgress size={24} color="inherit" /> : 'Activate User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Device ID Dialog */}
      <Dialog
        open={addDeviceDialogOpen}
        onClose={() => {
          setAddDeviceDialogOpen(false);
          setSelectedUser(null);
          setAddDeviceId('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add Device ID</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a Device ID (phone identifier) for <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          {selectedUser?.device_ids?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Device IDs:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedUser.device_ids.map((devId, idx) => (
                  <Chip key={idx} label={devId} size="small" sx={{ fontFamily: 'monospace' }} />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="New Device ID"
            value={addDeviceId}
            onChange={(e) => setAddDeviceId(e.target.value)}
            placeholder="Enter Device ID"
            disabled={addingDevice}
            required
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setAddDeviceDialogOpen(false);
              setSelectedUser(null);
              setAddDeviceId('');
            }}
            disabled={addingDevice}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddDeviceId}
            disabled={addingDevice || !addDeviceId.trim()}
            sx={{
              borderRadius: 3,
              bgcolor: '#9c27b0',
              color: '#fff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#7b1fa2' },
            }}
          >
            {addingDevice ? <CircularProgress size={24} color="inherit" /> : 'Add Device ID'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add BLE ID Dialog */}
      <Dialog
        open={addBleDialogOpen}
        onClose={() => {
          setAddBleDialogOpen(false);
          setSelectedUser(null);
          setAddBleId('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add BLE ID</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add an 8-character BLE ID for <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          {selectedUser?.ble_ids?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Current BLE IDs:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedUser.ble_ids.map((bleId, idx) => (
                  <Chip key={idx} label={bleId} size="small" color="primary" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="New BLE ID"
            value={addBleId}
            onChange={(e) => setAddBleId(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="Enter 8-character BLE ID"
            disabled={addingBle}
            required
            helperText={`${addBleId.length}/8 characters`}
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setAddBleDialogOpen(false);
              setSelectedUser(null);
              setAddBleId('');
            }}
            disabled={addingBle}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddBleId}
            disabled={addingBle || addBleId.length !== 8}
            sx={{
              borderRadius: 3,
              bgcolor: '#00bcd4',
              color: '#fff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#00acc1' },
            }}
          >
            {addingBle ? <CircularProgress size={24} color="inherit" /> : 'Add BLE ID'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
