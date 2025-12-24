import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, Delete, People } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
    if (searchParams.get('action') === 'create') {
      setDialogOpen(true);
      setSearchParams({});
    }
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    
    try {
      await axios.post(`${API}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('User created successfully');
      setDialogOpen(false);
      setFormData({ name: '', email: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create user';
      toast.error(message);
    } finally {
      setCreating(false);
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
            Management
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
            Users
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          data-testid="add-new-user-button"
          sx={{
            borderRadius: 3,
            py: 1.5,
            px: 3,
            bgcolor: '#F9B970',
            color: '#1a1a1a',
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#EF5C1E',
              color: '#fff',
            },
          }}
        >
          Add New User
        </Button>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 300, mx: 'auto' }}>
            Get started by adding your first user to the system.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            data-testid="empty-state-add-button"
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              bgcolor: '#F9B970',
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#EF5C1E',
                color: '#fff',
              },
            }}
          >
            Add New User
          </Button>
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
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        bgcolor: 'rgba(249, 185, 112, 0.15)',
                        color: '#EF5C1E',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={deleting === user.id}
                      data-testid={`delete-user-${user.id}`}
                      sx={{
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.lighter' },
                      }}
                    >
                      {deleting === user.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Delete fontSize="small" />
                      )}
                    </IconButton>
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

      {/* Create User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        data-testid="create-user-dialog"
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add New User</DialogTitle>
        <form onSubmit={handleCreateUser}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create a new user account. All fields are required.
            </Typography>
            
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={creating}
              data-testid="create-user-name-input"
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled={creating}
              data-testid="create-user-email-input"
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 3 } }}
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={creating}
                data-testid="create-user-role-select"
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={creating}
              data-testid="create-user-cancel-button"
              sx={{ borderRadius: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating}
              data-testid="create-user-submit-button"
              sx={{
                borderRadius: 3,
                bgcolor: '#F9B970',
                color: '#1a1a1a',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#EF5C1E',
                  color: '#fff',
                },
              }}
            >
              {creating ? <CircularProgress size={24} /> : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
