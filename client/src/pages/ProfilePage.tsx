import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  User, CalendarDays, AtSign, MessageSquare, BadgeCheck, 
  Shield, Edit3, ArrowLeft, Upload, Camera
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Profile schema for form validation
const profileSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters").max(30, "Nickname cannot exceed 30 characters"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  dateOfBirth: z.string().optional(),
  isPublicProfile: z.boolean().default(false),
  walletDescription: z.string().max(200, "Wallet description cannot exceed 200 characters").optional(),
  telegramUsername: z.string().max(50, "Telegram username cannot exceed 50 characters").optional(),
  twitterUsername: z.string().max(50, "Twitter username cannot exceed 50 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { translate } = useLanguage();
  const { isConnected, openConnectModal, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/user/profile-status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/profile-status');
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      return response.json();
    },
    enabled: isConnected,
  });
  
  // Form initialization with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: '',
      email: '',
      bio: '',
      dateOfBirth: '',
      isPublicProfile: false,
      walletDescription: '',
      telegramUsername: '',
      twitterUsername: '',
    },
  });
  
  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData && profileData.profile) {
      const { profile } = profileData;
      
      form.reset({
        nickname: profile.nickname || '',
        email: profile.email || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth || '',
        isPublicProfile: profile.isPublicProfile || false,
        walletDescription: profile.walletDescription || '',
        telegramUsername: profile.telegramUsername || '',
        twitterUsername: profile.twitterUsername || '',
      });
      
      if (profile.profileImageUrl) {
        setProfileImagePreview(profile.profileImageUrl);
      }
      
      if (profile.coverImageUrl) {
        setCoverImagePreview(profile.coverImageUrl);
      }
    }
  }, [profileData, form]);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      // Create form data if we have files
      if (profileImageFile || coverImageFile) {
        const formData = new FormData();
        
        // Add JSON data for other fields
        formData.append('data', JSON.stringify(values));
        
        // Add files if they exist
        if (profileImageFile) {
          formData.append('profileImage', profileImageFile);
        }
        
        if (coverImageFile) {
          formData.append('coverImage', coverImageFile);
        }
        
        // Use a custom headers object that doesn't set Content-Type
        // Let the browser set it for FormData
        const response = await fetch(`/api/user/update-profile`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        return response.json();
      } else {
        // Regular JSON update without files
        const response = await apiRequest('POST', '/api/user/update-profile', values);
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-status'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });
  
  // Handle profile form submission
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  // Handle profile image change
  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle cover image change
  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // If not connected, show a message prompting to connect wallet
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              {translate("profile_title") || "My TAS Profile"}
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {translate("profile_description") || "Manage your TAS Chain profile and settings"}
          </p>
        </div>
        
        <Card className="text-center border-primary/20 md:col-span-2">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
            <CardTitle className="text-primary">{translate("connect_your_wallet") || "Connect Your Wallet"}</CardTitle>
            <CardDescription>
              {translate("connect_wallet_to_access") || "Connect your wallet to access your profile"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 py-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center max-w-md mx-auto">
              <p className="text-muted-foreground">
                {translate("connect_wallet_for_profile") || 
                  "You need to connect your wallet to access and manage your profile settings."}
              </p>
            </div>
            <Button 
              onClick={openConnectModal} 
              className="bg-gradient-to-r from-primary to-sky-500 text-white mx-auto"
              size="lg"
            >
              {translate("connect_wallet") || "Connect Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              {translate("profile_title") || "My TAS Profile"}
            </span>
          </h1>
        </div>
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-40 bg-gray-200 rounded-lg w-full"></div>
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Profile view mode (not editing)
  if (!isEditing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
              {translate("profile_title") || "My TAS Profile"}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {translate("profile_description") || "Manage your TAS Chain profile and settings"}
          </p>
        </div>
        
        <Card className="border-primary/20 overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-r from-primary/20 to-sky-300/30 overflow-hidden">
            {coverImagePreview ? (
              <img 
                src={coverImagePreview} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/20 to-sky-300/30"></div>
            )}
          </div>
          
          {/* Profile header with avatar */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex justify-between items-start mt-[-50px]">
              <Avatar className="h-24 w-24 border-4 border-background">
                {profileImagePreview ? (
                  <AvatarImage src={profileImagePreview} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-primary to-blue-500 text-white text-2xl">
                    {(profileData?.profile?.nickname?.substring(0, 2) || address?.substring(2, 4) || "TA").toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
            
            <div className="mt-4">
              <h2 className="text-2xl font-bold">
                {profileData?.profile?.nickname || `User ${address?.substring(0, 6)}`}
              </h2>
              {profileData?.profile?.isPublicProfile && (
                <div className="flex items-center text-green-600 text-sm mt-1">
                  <BadgeCheck className="h-4 w-4 mr-1" />
                  Public Profile
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 opacity-70" />
                <span>Wallet: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
              </div>
              
              {profileData?.profile?.dateOfBirth && (
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
                  <span>{new Date(profileData.profile.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              
              {profileData?.profile?.email && (
                <div className="flex items-center">
                  <AtSign className="h-4 w-4 mr-2 opacity-70" />
                  <span>{profileData.profile.email}</span>
                </div>
              )}
            </div>
            
            {profileData?.profile?.bio && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30">
                <p className="text-sm leading-relaxed">{profileData.profile.bio}</p>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Wallet</h3>
              <div className="px-4 py-3 bg-primary/5 rounded-lg">
                <p className="text-sm font-mono break-all">{address}</p>
                {profileData?.profile?.walletDescription && (
                  <p className="text-sm mt-2 text-muted-foreground">{profileData.profile.walletDescription}</p>
                )}
              </div>
            </div>
            
            {(profileData?.profile?.telegramUsername || profileData?.profile?.twitterUsername) && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Social Profiles</h3>
                <div className="space-y-2">
                  {profileData?.profile?.telegramUsername && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                      </div>
                      <span>@{profileData.profile.telegramUsername}</span>
                    </div>
                  )}
                  
                  {profileData?.profile?.twitterUsername && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                      </div>
                      <span>@{profileData.profile.twitterUsername}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }
  
  // Profile edit mode
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
        
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary to-sky-500 text-transparent bg-clip-text">
            Edit Profile
          </span>
        </h1>
        <p className="text-muted-foreground">
          Update your profile information and settings
        </p>
      </div>
      
      <Card className="border-primary/20">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-sky-100/20">
          <CardTitle className="text-primary flex items-center">
            <Edit3 className="h-5 w-5 mr-2" />
            Edit Your Profile
          </CardTitle>
          <CardDescription>
            Customize how others see you on TAS Chain
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Images Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Profile Images</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Image Upload */}
                  <div>
                    <Label htmlFor="profileImage">Profile Picture</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          {profileImagePreview ? (
                            <AvatarImage src={profileImagePreview} alt="Profile" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-primary to-blue-500 text-white text-2xl">
                              {form.getValues("nickname")?.substring(0, 2) || address?.substring(2, 4) || "TA"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <Label
                          htmlFor="profileImage"
                          className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Upload profile picture</span>
                        </Label>
                      </div>
                      <div>
                        <Input
                          id="profileImage"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                        />
                        <Label
                          htmlFor="profileImage"
                          className="text-sm px-3 py-2 bg-muted rounded-md inline-flex items-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Image
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 400x400px, max 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cover Image Upload */}
                  <div>
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <div className="mt-2">
                      <div className="relative h-28 w-full rounded-md overflow-hidden bg-muted mb-2">
                        {coverImagePreview ? (
                          <img
                            src={coverImagePreview}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-r from-primary/20 to-sky-300/30 flex items-center justify-center">
                            <span className="text-muted-foreground">No cover image</span>
                          </div>
                        )}
                        <Label
                          htmlFor="coverImage"
                          className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Upload cover image</span>
                        </Label>
                      </div>
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                      <Label
                        htmlFor="coverImage"
                        className="text-sm px-3 py-2 bg-muted rounded-md inline-flex items-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Cover
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 1500x500px, max 3MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="Your nickname" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is how you'll appear on TAS Chain
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your email will not be displayed publicly
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell others about yourself..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Wallet Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Wallet Information</h3>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <Label className="text-sm font-medium">Wallet Address</Label>
                  <p className="font-mono text-sm mt-1 break-all">{address}</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="walletDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a description for your wallet..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what you use this wallet for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Social Media Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Social Media (Optional)</h3>
                
                <FormField
                  control={form.control}
                  name="telegramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 inset-y-0 flex items-center text-muted-foreground">@</span>
                          <Input 
                            placeholder="username" 
                            className="pl-8" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twitterUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 inset-y-0 flex items-center text-muted-foreground">@</span>
                          <Input 
                            placeholder="username" 
                            className="pl-8" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Privacy Settings</h3>
                
                <FormField
                  control={form.control}
                  name="isPublicProfile"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Profile</FormLabel>
                        <FormDescription>
                          Allow others to view your profile, transactions, and token holdings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-sky-500 text-white"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;