import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import BrowserCompatibilityWrapper from "@/components/BrowserCompatibilityWrapper";
import PageNumberDebug from "@/components/PageNumberDebug";
import { Loader2, Shield, Users, Wallet, CheckCircle2, Clock } from "lucide-react";

interface AdminStats {
  totalWallets: number;
  totalProfiles: number;
  verifiedProfiles: number;
  unverifiedProfiles: number;
  totalTokensCreated: number;
  totalTrades: number;
}

interface VerifiedProfile {
  id: number;
  username: string;
  walletAddress: string;
  emailVerified: boolean;
  publicProfile: boolean;
  joinedDate: string;
  points: number;
  publicProfileUrl?: string;
}

const AdminPage: React.FC = () => {
  const { toast } = useToast();
  const { isConnected, address, isAdmin } = useWallet();

  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      return response.json();
    },
    enabled: isConnected && isAdmin,
  });

  // Fetch verified profiles
  const { data: verifiedProfiles, isLoading: isLoadingProfiles } = useQuery<VerifiedProfile[]>({
    queryKey: ['/api/admin/verified-profiles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/verified-profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch verified profiles');
      }
      return response.json();
    },
    enabled: isConnected && isAdmin,
  });

  // Check if user is not connected or not an admin
  if (!isConnected || !isAdmin) {
    return (
      <BrowserCompatibilityWrapper pageName="AdminPage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={7} pageName="Admin" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                Admin Dashboard
              </span>
            </h1>
          </div>
          
          <Card className="text-center border-primary/20">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
              <CardTitle className="text-primary">Access Restricted</CardTitle>
              <CardDescription>
                You need to connect with an admin wallet to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center max-w-md mx-auto">
                <p className="text-muted-foreground">
                  This page is restricted to TAS administrators only. Please connect with an admin wallet to access the dashboard.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/wallet'} 
                className="bg-gradient-to-r from-primary to-sky-500 text-white mx-auto"
                size="lg"
              >
                Go to Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  // Loading state
  if (isLoadingStats || isLoadingProfiles) {
    return (
      <BrowserCompatibilityWrapper pageName="AdminPage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={7} pageName="Admin (Loading)" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                Admin Dashboard
              </span>
            </h1>
          </div>
          
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </BrowserCompatibilityWrapper>
    );
  }

  return (
    <BrowserCompatibilityWrapper pageName="AdminPage">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageNumberDebug pageNumber={7} pageName="Admin" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Monitor user statistics, wallet creation, and verified profiles
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-primary/10 p-1 text-primary w-full md:max-w-md mx-auto">
            <TabsTrigger 
              value="overview" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="verified" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verified Profiles
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-primary" />
                    Total Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalWallets || 0}</div>
                  <p className="text-sm text-muted-foreground">Created wallets on TAS platform</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Total Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalProfiles || 0}</div>
                  <p className="text-sm text-muted-foreground">User profiles on TAS platform</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                    Verified Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.verifiedProfiles || 0}</div>
                  <p className="text-sm text-muted-foreground">Email verified profiles</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Overview of platform metrics and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Verified Profiles:</span>
                      <span className="font-medium">{stats?.verifiedProfiles || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Unverified Profiles:</span>
                      <span className="font-medium">{stats?.unverifiedProfiles || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Verification Rate:</span>
                      <span className="font-medium">
                        {stats?.totalProfiles && stats.totalProfiles > 0
                          ? `${Math.round((stats.verifiedProfiles / stats.totalProfiles) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tokens Created:</span>
                      <span className="font-medium">{stats?.totalTokensCreated || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Trades:</span>
                      <span className="font-medium">{stats?.totalTrades || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tokens Per User:</span>
                      <span className="font-medium">
                        {stats?.totalProfiles && stats.totalProfiles > 0
                          ? (stats.totalTokensCreated / stats.totalProfiles).toFixed(2)
                          : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Verified Profiles Tab */}
          <TabsContent value="verified" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verified Profiles</CardTitle>
                <CardDescription>
                  Users with verified email addresses and their wallet information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedProfiles && verifiedProfiles.length > 0 ? (
                        verifiedProfiles.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.username}</TableCell>
                            <TableCell className="font-mono text-xs truncate max-w-[150px]">
                              {profile.walletAddress}
                            </TableCell>
                            <TableCell>{profile.joinedDate}</TableCell>
                            <TableCell>
                              {profile.publicProfile ? (
                                <Badge className="bg-green-500">Public</Badge>
                              ) : (
                                <Badge variant="outline">Private</Badge>
                              )}
                            </TableCell>
                            <TableCell>{profile.points}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No verified profiles found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {verifiedProfiles && verifiedProfiles.length > 0 && verifiedProfiles.some(p => p.publicProfile && p.publicProfileUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Public Profiles</CardTitle>
                  <CardDescription>
                    Public profiles with shareable URLs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {verifiedProfiles
                      .filter(p => p.publicProfile && p.publicProfileUrl)
                      .map((profile) => (
                        <div key={profile.id} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{profile.username}</h3>
                              <p className="text-sm text-muted-foreground">
                                {profile.points} points
                              </p>
                            </div>
                            <Badge className="bg-green-500">Public</Badge>
                          </div>
                          <div className="bg-gray-50 p-2 rounded text-sm font-mono break-all">
                            {profile.publicProfileUrl}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default AdminPage;