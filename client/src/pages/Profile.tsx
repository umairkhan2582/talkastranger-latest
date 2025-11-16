import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BrowserCompatibilityWrapper from "@/components/BrowserCompatibilityWrapper";
import PageNumberDebug from "@/components/PageNumberDebug";
import { Loader2, Mail, Check, Globe, Trophy, ShieldCheck, Star, Wallet, Upload, Edit, Camera, Instagram, AtSign, Twitter, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  emailVerified: boolean;
  bio: string | null;
  publicProfile: boolean;
  walletAddress: string | null;
  points: number;
  joined: string;
  referralCode: string;
  airdropEligible: boolean;
  badges: string[];
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  publicProfileUrl?: string;
  stats: {
    trades: number;
    tokens: number;
    transactions: number;
  };
}

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [publicProfile, setPublicProfile] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/profile-status');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
    enabled: isConnected,
  });

  // Update profile settings
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { bio?: string; publicProfile?: boolean }) => {
      const response = await apiRequest('POST', '/api/user/update-profile', profileData);
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-status'] });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Send email verification code
  const sendVerificationMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      const response = await apiRequest('POST', '/api/user/send-verification', { email: emailAddress });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification code');
      }
      return response.json();
    },
    onSuccess: () => {
      setVerificationCodeSent(true);
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the verification code',
      });
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to send verification code',
        variant: 'destructive',
      });
    },
  });

  // Verify email code
  const verifyEmailMutation = useMutation({
    mutationFn: async (code: string) => {
      setIsSubmittingCode(true);
      const response = await apiRequest('POST', '/api/user/verify-email', { code });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid verification code');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmittingCode(false);
      setVerificationCodeSent(false);
      setVerificationCode('');
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified successfully. You are now eligible for the TAS airdrop!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-status'] });
    },
    onError: (error) => {
      setIsSubmittingCode(false);
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Failed to verify email',
        variant: 'destructive',
      });
    },
  });

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingProfileImage(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload profile image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsUploadingProfileImage(false);
      setProfileImageUrl(data.profileImageUrl);
      toast({
        title: 'Profile Image Updated',
        description: 'Your profile image has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-status'] });
    },
    onError: (error) => {
      setIsUploadingProfileImage(false);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    },
  });
  
  // Cover image upload mutation
  const uploadCoverImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingCoverImage(true);
      const formData = new FormData();
      formData.append('coverImage', file);
      
      const response = await fetch('/api/user/upload-cover-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload cover image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsUploadingCoverImage(false);
      setCoverImageUrl(data.coverImageUrl);
      toast({
        title: 'Cover Image Updated',
        description: 'Your cover image has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-status'] });
    },
    onError: (error) => {
      setIsUploadingCoverImage(false);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    },
  });
  
  // Handle profile image selection
  const handleProfileImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'Profile image must be smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Only image files are allowed',
          variant: 'destructive',
        });
        return;
      }
      
      uploadProfileImageMutation.mutate(file);
    }
  };
  
  // Handle cover image selection
  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File Too Large',
          description: 'Cover image must be smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Only image files are allowed',
          variant: 'destructive',
        });
        return;
      }
      
      uploadCoverImageMutation.mutate(file);
    }
  };
  
  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setBio(profile.bio || '');
      setPublicProfile(profile.publicProfile);
      setProfileImageUrl(profile.profileImageUrl);
      setCoverImageUrl(profile.coverImageUrl);
    }
  }, [profile]);

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      bio,
      publicProfile
    });
  };

  const handleSendVerification = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    sendVerificationMutation.mutate(email);
  };

  const handleVerifyEmail = () => {
    if (!verificationCode) {
      toast({
        title: 'Verification Code Required',
        description: 'Please enter the verification code sent to your email',
        variant: 'destructive',
      });
      return;
    }
    
    verifyEmailMutation.mutate(verificationCode);
  };

  // If not connected, show a message to connect wallet first
  if (!isConnected) {
    return (
      <BrowserCompatibilityWrapper pageName="ProfilePage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={3} pageName="Profile" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                User Profile
              </span>
            </h1>
          </div>
          
          <Card className="text-center border-primary/20 md:col-span-2">
            <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
              <CardTitle className="text-primary">Connect Wallet First</CardTitle>
              <CardDescription>
                You need to connect your wallet to access your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center max-w-md mx-auto">
                <p className="text-muted-foreground">
                  Connect your wallet to view and edit your profile, verify your email, and become eligible for the TAS airdrop.
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
  if (isLoading) {
    return (
      <BrowserCompatibilityWrapper pageName="ProfilePage">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <PageNumberDebug pageNumber={3} pageName="Profile (Loading)" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
                User Profile
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
    <BrowserCompatibilityWrapper pageName="ProfilePage">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageNumberDebug pageNumber={3} pageName="Profile" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              User Profile
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your profile, verify your email for TAS airdrop, and control your public profile settings
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-primary/10 p-1 text-primary w-full md:max-w-md mx-auto">
            <TabsTrigger 
              value="profile" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="airdrop" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              TAS Airdrop
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Cover Photo Section */}
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-20">
              {/* Cover Photo Display */}
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                {coverImageUrl ? (
                  <img 
                    src={coverImageUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-r from-primary/5 to-sky-500/5 w-full h-full flex items-center justify-center">
                    <Globe className="h-10 w-10 text-primary/30" />
                  </div>
                )}
              </div>
              
              {/* Cover Photo Upload Button */}
              <div className="absolute bottom-4 right-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-md"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={isUploadingCoverImage}
                >
                  {isUploadingCoverImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {coverImageUrl ? 'Change Cover' : 'Add Cover Photo'}
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  ref={coverImageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverImageSelect}
                />
              </div>
              
              {/* Profile Picture Overlay */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={profileImageUrl || undefined} 
                      alt={profile?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-primary/10 text-3xl">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background shadow-md hover:bg-primary/5"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={isUploadingProfileImage}
                  >
                    {isUploadingProfileImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={profileImageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageSelect}
                  />
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">User Information</CardTitle>
                <CardDescription>
                  Your public profile and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile?.walletAddress && (
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="p-3 bg-gray-50 rounded-md border text-sm font-mono break-all">
                      {profile.walletAddress}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile?.username || ''} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about yourself" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="publicProfile" 
                    checked={publicProfile}
                    onCheckedChange={(checked) => setPublicProfile(checked as boolean)}
                  />
                  <div className="grid gap-1.5">
                    <Label htmlFor="publicProfile" className="font-medium">
                      Public Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile public to earn more points and rewards. 
                      Public profiles show your trading stats and achievements.
                    </p>
                  </div>
                </div>
                
                {profile?.publicProfile && (
                  <>
                    <Alert className="mb-4">
                      <Trophy className="h-4 w-4" />
                      <AlertTitle>Profile Points: {profile.points}</AlertTitle>
                      <AlertDescription>
                        You've earned {profile.points} points with your public profile! 
                        Keep trading to earn more rewards.
                      </AlertDescription>
                    </Alert>
                    
                    {profile.publicProfileUrl && (
                      <div className="p-4 bg-primary/5 rounded-lg border space-y-2">
                        <h3 className="text-sm font-medium">Your Public Profile URL</h3>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={profile.publicProfileUrl} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(profile.publicProfileUrl || '');
                              toast({
                                title: 'URL Copied',
                                description: 'Your public profile URL has been copied to clipboard',
                              });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this URL with others to show off your TAS trading profile and stats
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-primary to-sky-500 text-white"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {profile?.publicProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Public Stats</CardTitle>
                  <CardDescription>
                    Your public trading statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center border">
                      <p className="text-sm text-muted-foreground">Trades</p>
                      <p className="text-3xl font-bold text-primary">{profile.stats.trades}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border">
                      <p className="text-sm text-muted-foreground">Tokens</p>
                      <p className="text-3xl font-bold text-primary">{profile.stats.tokens}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-3xl font-bold text-primary">{profile.stats.transactions}</p>
                    </div>
                  </div>
                  
                  {profile.badges.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Badges</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.badges.map((badge, index) => (
                          <Badge key={index} variant="secondary" className="py-1">
                            <Star className="h-3 w-3 mr-1" />
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* TAS Airdrop Tab */}
          <TabsContent value="airdrop" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">TAS Airdrop Eligibility</CardTitle>
                <CardDescription>
                  Verify your email to become eligible for TAS token airdrops
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile?.emailVerified ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Email Verified</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your email has been verified and you are eligible for the TAS airdrop!
                      {profile.airdropEligible && " You're on the list for the next airdrop."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>Verification Required</AlertTitle>
                      <AlertDescription>
                        Verify your email address to become eligible for TAS token airdrops. 
                        Your email will only be used for important notifications.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your@email.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={verificationCodeSent}
                        />
                        <Button 
                          onClick={handleSendVerification}
                          disabled={sendVerificationMutation.isPending || verificationCodeSent}
                          variant={verificationCodeSent ? "outline" : "default"}
                          className={!verificationCodeSent ? "bg-gradient-to-r from-primary to-sky-500 text-white" : ""}
                        >
                          {sendVerificationMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : verificationCodeSent ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Code
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {verificationCodeSent && (
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">Verification Code</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="verificationCode" 
                            placeholder="Enter 6-digit code" 
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                          <Button 
                            onClick={handleVerifyEmail}
                            disabled={isSubmittingCode || !verificationCode}
                            className="bg-gradient-to-r from-primary to-sky-500 text-white"
                          >
                            {isSubmittingCode ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the verification code sent to your email address
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg border mt-4">
                  <h3 className="text-sm font-medium mb-2">TAS Airdrop Information</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Verified users will receive TAS tokens in upcoming airdrops
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Public profiles earn 20% more tokens in airdrops
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Active traders with public profiles get bonus rewards
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      Refer friends to earn additional TAS tokens
                    </li>
                  </ul>
                </div>
                
                {profile?.referralCode && (
                  <div className="space-y-2">
                    <Label>Your Referral Code</Label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-50 rounded-md border text-sm font-mono flex-1">
                        {profile.referralCode}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(profile.referralCode);
                          toast({
                            title: "Copied to clipboard",
                            description: "Referral code has been copied to clipboard",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share your referral code with friends and earn 5% of their airdrop rewards
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BrowserCompatibilityWrapper>
  );
};

export default ProfilePage;