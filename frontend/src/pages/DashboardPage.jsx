import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Users, ArrowRight, Plus, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DashboardPage = () => {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axios.get(`${API}/users/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
          Overview
        </p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* User Count Card */}
        <div className="bento-card p-8 col-span-1 md:col-span-2 lg:col-span-1" data-testid="user-count-card">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-primary/10 rounded-sm">
              <Users className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Total Users
          </p>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="stat-number text-foreground" data-testid="user-count-value">
              {userCount}
            </p>
          )}
        </div>

        {/* View User Listing Card */}
        <div className="bento-card p-8 flex flex-col justify-between" data-testid="view-users-card">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Quick Action
            </p>
            <h3 className="font-heading text-xl font-semibold tracking-tight mb-2">
              User Listing
            </h3>
            <p className="text-sm text-muted-foreground">
              View and manage all registered users in the system.
            </p>
          </div>
          <Button 
            className="mt-6 rounded-sm btn-active"
            onClick={() => navigate('/users')}
            data-testid="view-user-listing-button"
          >
            View User Listing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Create New User Card */}
        <div className="bento-card p-8 flex flex-col justify-between" data-testid="create-user-card">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Quick Action
            </p>
            <h3 className="font-heading text-xl font-semibold tracking-tight mb-2">
              Add User
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a new user account with custom permissions.
            </p>
          </div>
          <Button 
            className="mt-6 rounded-sm btn-active"
            onClick={() => navigate('/users?action=create')}
            data-testid="create-new-user-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New User
          </Button>
        </div>
      </div>
    </div>
  );
};
