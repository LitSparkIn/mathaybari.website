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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete, People, CheckCircle, Cancel, Key, VpnKey, Edit, Add, Close } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [resettingSecretCode, setResettingSecretCode] = useState(null);
  const { token } = useAuth();

  // Activation modal state
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deviceNumber, setDeviceNumber] = useState('');
  const [deviceMacAddress, setDeviceMacAddress] = useState('');
  const [activating, setActivating] = useState(false);

  // Edit device modal state
  const [editDeviceDialogOpen, setEditDeviceDialogOpen] = useState(false);
  const [editDeviceNumber, setEditDeviceNumber] = useState('');
  const [editMacAddresses, setEditMacAddresses] = useState([]);
  const [newMacAddress, setNewMacAddress] = useState('');
  const [editingDevice, setEditingDevice] = useState(false);

  // Add MAC modal state
  const [addMacDialogOpen, setAddMacDialogOpen] = useState(false);
  const [addMacAddress, setAddMacAddress] = useState('');
  const [addingMac, setAddingMac] = useState(false);

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
      setDeviceNumber(user.device_number || '');
      setDeviceMacAddress('');
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
    if (!deviceNumber.trim()) {
      toast.error('Device number is required');
      return;
    }
    if (!deviceMacAddress.trim()) {
      toast.error('Device MAC address is required');
      return;
    }

    setActivating(true);
    
    try {
      const url = `${API}/users/${selectedUser.user_id}/status?status=Active&device_number=${encodeURIComponent(deviceNumber)}&device_mac_address=${encodeURIComponent(deviceMacAddress)}`;
      
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
        setDeviceMacAddress('');
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

  const handleEditDevice = (user) => {
    setSelectedUser(user);
    setEditDeviceNumber(user.device_number || '');
    setEditMacAddresses(user.device_mac_addresses || []);
    setNewMacAddress('');
    setEditDeviceDialogOpen(true);
  };

  const handleAddMacToList = () => {
    if (!newMacAddress.trim()) return;
    if (editMacAddresses.includes(newMacAddress.trim())) {
      toast.error('MAC address already exists');
      return;
    }
    setEditMacAddresses([...editMacAddresses, newMacAddress.trim()]);
    setNewMacAddress('');
  };

  const handleRemoveMacFromList = (mac) => {
    setEditMacAddresses(editMacAddresses.filter(m => m !== mac));
  };

  const handleSaveDevice = async () => {
    if (!editDeviceNumber.trim()) {
      toast.error('Device number is required');
      return;
    }
    if (editMacAddresses.length === 0) {
      toast.error('At least one MAC address is required');
      return;
    }

    setEditingDevice(true);
    
    try {
      const url = `${API}/users/${selectedUser.user_id}/device?device_number=${encodeURIComponent(editDeviceNumber)}&device_mac_addresses=${encodeURIComponent(editMacAddresses.join(','))}`;
      
      const response = await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('Device details updated successfully');
        setEditDeviceDialogOpen(false);
        setSelectedUser(null);
        setEditDeviceNumber('');
        setEditMacAddresses([]);
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to update device details');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to update device details');
    } finally {
      setEditingDevice(false);
    }
  };

  const handleOpenAddMac = (user) => {
    setSelectedUser(user);
    setAddMacAddress('');
    setAddMacDialogOpen(true);
  };

  const handleAddMacAddress = async () => {
    if (!addMacAddress.trim()) {
      toast.error('MAC address is required');
      return;
    }

    setAddingMac(true);
    
    try {
      const response = await axios.post(
        `${API}/users/${selectedUser.user_id}/mac-address?mac_address=${encodeURIComponent(addMacAddress)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success('MAC address added successfully');
        setAddMacDialogOpen(false);
        setSelectedUser(null);
        setAddMacAddress('');
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to add MAC address');
      }
    } catch (error) {
      toast.error(error.response?.data?.data?.message || 'Failed to add MAC address');
    } finally {
      setAddingMac(false);
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

  const handleResetSecretCode = async (userId, userName) => {
    if (!window.confirm(`Reset secret code for ${userName}?`)) {
      return;
    }

    setResettingSecretCode(userId);
    
    try {
      const response = await axios.patch(
        `${API}/users/${userId}/reset-secret-code`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        toast.success(`Secret code reset! New code: ${response.data.data.new_secret_code}`);
        fetchUsers();
      } else {
        toast.error(response.data.data.message || 'Failed to reset secret code');
      }
    } catch (error) {
      toast.error('Failed to reset secret code');
    } finally {
      setResettingSecretCode(null);
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
                <TableCell sx={{ fontWeight: 600 }}>Device Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>MAC Addresses</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Run Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Password</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Secret Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 220 }}>Actions</TableCell>
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
                  <TableCell>
                    {user.device_mac_addresses && user.device_mac_addresses.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.device_mac_addresses.map((mac, idx) => (
                          <Chip
                            key={idx}
                            label={mac}
                            size="small"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              height: 22,
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
                            <CircularProgress size={18} />
                          ) : user.status === 'Active' ? (
                            <Cancel fontSize="small" />
                          ) : (
                            <CheckCircle fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Device">
                        <IconButton
                          size="small"
                          onClick={() => handleEditDevice(user)}
                          data-testid={`edit-device-${user.user_id}`}
                          sx={{
                            color: '#9c27b0',
                            '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.1)' },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add MAC Address">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenAddMac(user)}
                          data-testid={`add-mac-${user.user_id}`}
                          sx={{
                            color: '#00bcd4',
                            '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.1)' },
                          }}
                        >
                          <Add fontSize="small" />
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
                      <Tooltip title="Reset Secret Code">
                        <IconButton
                          size="small"
                          onClick={() => handleResetSecretCode(user.user_id, user.name)}
                          disabled={resettingSecretCode === user.user_id}
                          data-testid={`reset-secret-${user.user_id}`}
                          sx={{
                            color: '#2196f3',
                            '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' },
                          }}
                        >
                          {resettingSecretCode === user.user_id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <VpnKey fontSize="small" />
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
          setDeviceNumber('');
          setDeviceMacAddress('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Activate User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the device details to activate <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          <TextField
            fullWidth
            label="Device Number"
            value={deviceNumber}
            onChange={(e) => setDeviceNumber(e.target.value)}
            placeholder="Enter device number"
            disabled={activating}
            required
            sx={{ mb: 3 }}
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          <TextField
            fullWidth
            label="Device MAC Address"
            value={deviceMacAddress}
            onChange={(e) => setDeviceMacAddress(e.target.value)}
            placeholder="e.g., AA:BB:CC:DD:EE:FF"
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
              setDeviceNumber('');
              setDeviceMacAddress('');
            }}
            disabled={activating}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivateUser}
            disabled={activating || !deviceNumber.trim() || !deviceMacAddress.trim()}
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

      {/* Edit Device Dialog */}
      <Dialog
        open={editDeviceDialogOpen}
        onClose={() => {
          setEditDeviceDialogOpen(false);
          setSelectedUser(null);
          setEditDeviceNumber('');
          setEditMacAddresses([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Device Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update device details for <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          <TextField
            fullWidth
            label="Device Number"
            value={editDeviceNumber}
            onChange={(e) => setEditDeviceNumber(e.target.value)}
            placeholder="Enter device number"
            disabled={editingDevice}
            required
            sx={{ mb: 3 }}
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>MAC Addresses</Typography>
          
          {editMacAddresses.length > 0 && (
            <List dense sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
              {editMacAddresses.map((mac, idx) => (
                <ListItem key={idx}>
                  <ListItemText 
                    primary={mac} 
                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => handleRemoveMacFromList(mac)}
                      disabled={editingDevice}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Add MAC Address"
              value={newMacAddress}
              onChange={(e) => setNewMacAddress(e.target.value)}
              placeholder="e.g., AA:BB:CC:DD:EE:FF"
              disabled={editingDevice}
              size="small"
              InputProps={{ sx: { borderRadius: 3 } }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMacToList()}
            />
            <Button
              variant="outlined"
              onClick={handleAddMacToList}
              disabled={editingDevice || !newMacAddress.trim()}
              sx={{ borderRadius: 3, minWidth: 80 }}
            >
              Add
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setEditDeviceDialogOpen(false);
              setSelectedUser(null);
              setEditDeviceNumber('');
              setEditMacAddresses([]);
            }}
            disabled={editingDevice}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDevice}
            disabled={editingDevice || !editDeviceNumber.trim() || editMacAddresses.length === 0}
            sx={{
              borderRadius: 3,
              bgcolor: '#9c27b0',
              color: '#fff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#7b1fa2' },
            }}
          >
            {editingDevice ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add MAC Address Dialog */}
      <Dialog
        open={addMacDialogOpen}
        onClose={() => {
          setAddMacDialogOpen(false);
          setSelectedUser(null);
          setAddMacAddress('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add MAC Address</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new MAC address for <strong>{selectedUser?.name}</strong>.
          </Typography>
          
          {selectedUser?.device_mac_addresses?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Current MAC Addresses:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedUser.device_mac_addresses.map((mac, idx) => (
                  <Chip
                    key={idx}
                    label={mac}
                    size="small"
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            label="New MAC Address"
            value={addMacAddress}
            onChange={(e) => setAddMacAddress(e.target.value)}
            placeholder="e.g., AA:BB:CC:DD:EE:FF"
            disabled={addingMac}
            required
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setAddMacDialogOpen(false);
              setSelectedUser(null);
              setAddMacAddress('');
            }}
            disabled={addingMac}
            sx={{ borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMacAddress}
            disabled={addingMac || !addMacAddress.trim()}
            sx={{
              borderRadius: 3,
              bgcolor: '#00bcd4',
              color: '#fff',
              fontWeight: 600,
              '&:hover': { bgcolor: '#00acc1' },
            }}
          >
            {addingMac ? <CircularProgress size={24} color="inherit" /> : 'Add MAC Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
