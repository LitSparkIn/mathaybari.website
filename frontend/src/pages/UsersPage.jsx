import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';

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
    // Check if we should open create dialog from URL param
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
    <div className="p-6 md:p-8 lg:p-12" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Management
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
            Users
          </h1>
        </div>
        <Button 
          className="rounded-sm btn-active w-fit"
          onClick={() => setDialogOpen(true)}
          data-testid="add-new-user-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        /* Empty State */
        <div className="empty-state border border-border rounded-sm" data-testid="empty-state">
          <div className="p-4 bg-muted rounded-sm mb-6">
            <Users className="h-12 w-12 text-muted-foreground" strokeWidth={1} />
          </div>
          <h3 className="font-heading text-xl font-semibold tracking-tight mb-2">
            No users yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Get started by adding your first user to the system.
          </p>
          <Button 
            className="rounded-sm btn-active"
            onClick={() => setDialogOpen(true)}
            data-testid="empty-state-add-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      ) : (
        /* Users Table */
        <div className="border border-border rounded-sm overflow-hidden" data-testid="users-table-container">
          <Table className="data-table">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-heading">Name</TableHead>
                <TableHead className="font-heading">Email</TableHead>
                <TableHead className="font-heading">Role</TableHead>
                <TableHead className="font-heading">Created</TableHead>
                <TableHead className="font-heading w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-muted rounded-sm capitalize">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={deleting === user.id}
                      data-testid={`delete-user-${user.id}`}
                    >
                      {deleting === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Total count */}
      {!loading && users.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4 font-mono" data-testid="users-total-count">
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-sm" data-testid="create-user-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label 
                htmlFor="name"
                className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-sm"
                data-testid="create-user-name-input"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-sm font-mono"
                data-testid="create-user-email-input"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="role"
                className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={creating}
              >
                <SelectTrigger className="rounded-sm" data-testid="create-user-role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-sm"
                disabled={creating}
                data-testid="create-user-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-sm btn-active"
                disabled={creating}
                data-testid="create-user-submit-button"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
