import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Globe, Heart, Users } from 'lucide-react';
import { useLocation } from 'wouter';

export default function UserRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: '',
    gender: '',
    country: '',
    city: '',
    interests: [] as string[],
    bio: '',
    agreeToTerms: false,
    agreeToChat: false
  });

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Japan', 'South Korea', 'Brazil', 'India', 'Mexico', 'Spain',
    'Italy', 'Netherlands', 'Sweden', 'Norway', 'Other'
  ];

  const interestOptions = [
    'Technology', 'Gaming', 'Music', 'Movies', 'Sports', 'Travel', 
    'Photography', 'Art', 'Books', 'Food', 'Fashion', 'Science',
    'Business', 'Crypto', 'Fitness', 'Nature'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms || !formData.agreeToChat) {
      toast({
        title: "Agreement Required",
        description: "Please agree to our terms and chat guidelines",
        variant: "destructive"
      });
      return;
    }

    if (formData.interests.length < 2) {
      toast({
        title: "More Interests Needed",
        description: "Please select at least 2 interests to help us match you better",
        variant: "destructive"
      });
      return;
    }

    try {
      // Here you would typically send the registration data to your backend
      // For now, we'll simulate success and redirect to the main chat
      
      toast({
        title: "Welcome to TalkAStranger!",
        description: "Your profile has been created. You can now start chatting!",
      });

      // Store user data temporarily in localStorage
      localStorage.setItem('userProfile', JSON.stringify(formData));
      
      // Redirect to main chat
      setLocation('/chat');
      
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Join TalkAStranger
          </h1>
          <p className="text-gray-600">Connect with real people around the world</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <UserPlus className="w-5 h-5 mr-2" />
              Create Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="18+"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Your city"
                />
              </div>

              {/* Interests */}
              <div>
                <Label className="text-base font-medium flex items-center mb-3">
                  <Heart className="w-4 h-4 mr-2" />
                  Your Interests (Select at least 2)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {interestOptions.map(interest => (
                    <div
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.interests.includes(interest)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-center">{interest}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">About You (Optional)</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others a bit about yourself..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">{formData.bio.length}/200 characters</div>
              </div>

              {/* Agreements */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: !!checked }))}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chat-guidelines"
                    checked={formData.agreeToChat}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToChat: !!checked }))}
                  />
                  <Label htmlFor="chat-guidelines" className="text-sm">
                    I agree to follow community guidelines and chat respectfully
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                disabled={!formData.username || !formData.email || !formData.age || !formData.country}
              >
                <Users className="w-4 h-4 mr-2" />
                Start Chatting with Real People
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account? <button className="text-blue-600 hover:underline">Sign In</button>
        </div>
      </div>
    </div>
  );
}