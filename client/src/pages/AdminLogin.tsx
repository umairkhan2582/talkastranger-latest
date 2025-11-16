import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";
import BrowserCompatibilityWrapper from "@/components/BrowserCompatibilityWrapper";
import PageNumberDebug from "@/components/PageNumberDebug";
import { Shield, Loader2 } from "lucide-react";

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const { isConnected, isAdmin } = useWallet();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // If already authenticated as admin, redirect to admin page
  if (isConnected && isAdmin) {
    return <Redirect to="/admintower/dashboard" />;
  }

  // If login was successful, redirect to admin dashboard
  if (loginSuccess) {
    return <Redirect to="/admintower/dashboard" />;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Attempt to login with admin credentials
      const response = await apiRequest('POST', '/api/admin/login', {
        username,
        password
      });

      if (response.ok) {
        // Admin login successful
        const data = await response.json();
        
        toast({
          title: "Login Successful",
          description: "You are now logged in as admin",
        });
        
        setLoginSuccess(true);
      } else {
        // Login failed
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description: errorData.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred while trying to log in",
        variant: "destructive"
      });
      console.error("[AdminLogin] Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BrowserCompatibilityWrapper pageName="AdminLogin">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageNumberDebug pageNumber={7} pageName="Admin Login" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              Admin Login
            </span>
          </h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
          <Card className="flex-1 border-primary/20">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
              <CardTitle className="text-primary">Admin Authentication</CardTitle>
              <CardDescription>
                Login with your admin credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter admin username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter admin password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-sky-500 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card className="flex-1 border-primary/20">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
              <CardTitle className="text-primary">Admin Portal</CardTitle>
              <CardDescription>
                Admin access to TAS platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium">TASChain Admin</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Access the admin dashboard to monitor platform statistics, verify profiles, and 
                  manage the TASChain ecosystem.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
              <p>
                Restricted access. Unauthorized access attempts are logged and monitored.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default AdminLogin;