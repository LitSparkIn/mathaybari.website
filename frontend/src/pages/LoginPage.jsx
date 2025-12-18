import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });
      
      login(response.data.token, response.data.email);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split" data-testid="login-page">
      {/* Left side - Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="font-heading text-4xl font-bold tracking-tight">
              DICER
            </h1>
            <p className="text-muted-foreground mt-2">
              Admin Panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-sm h-12 font-mono"
                data-testid="login-email-input"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-sm h-12"
                data-testid="login-password-input"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-sm font-medium btn-active"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-8">
            Secure admin access only
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block relative bg-zinc-100">
        <img
          src="https://images.unsplash.com/photo-1561518065-a76ab6e7ab50?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMG1pbmltYWwlMjBhcmNoaXRlY3R1cmUlMjB3aGl0ZXxlbnwwfHx8fDE3NjYwNTY1Mzd8MA&ixlib=rb-4.1.0&q=85"
          alt="Abstract geometric architecture"
          className="absolute inset-0 w-full h-full object-cover login-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <blockquote className="text-white">
            <p className="font-heading text-2xl font-semibold tracking-tight leading-relaxed">
              "Simplicity is the ultimate sophistication."
            </p>
            <cite className="block mt-4 text-sm text-white/70 not-italic">
              — Leonardo da Vinci
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
};
