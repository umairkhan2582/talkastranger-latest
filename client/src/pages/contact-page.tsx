import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Phone, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ContactPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/10 to-white py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/50">
              <MessageSquare className="w-3 h-3 mr-1" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-slate-600 mb-8">
              Have a question or need assistance? We're here to help!
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-primary text-white p-6">
                        <Mail className="h-8 w-8 mb-3" />
                        <h3 className="text-xl font-semibold mb-1">Email Us</h3>
                        <p className="text-primary-foreground/90">We'll respond as soon as possible</p>
                      </div>
                      <div className="p-6">
                        <p className="font-medium text-lg">info@talkastranger.com</p>
                        <p className="text-slate-600 mt-1">For general inquiries</p>
                        
                        <p className="font-medium text-lg mt-4">talkastranger.dubai@gmail.com</p>
                        <p className="text-slate-600 mt-1">For business partnerships</p>
                        
                        <Button className="mt-4 w-full" variant="outline">
                          <Mail className="mr-2 h-4 w-4" /> Send an Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-amber-500 text-white p-6">
                        <MapPin className="h-8 w-8 mb-3" />
                        <h3 className="text-xl font-semibold mb-1">Visit Our Office</h3>
                        <p className="text-amber-50">Come say hello at our office</p>
                      </div>
                      <div className="p-6">
                        <p className="font-medium text-lg">Dubai Office</p>
                        <p className="text-slate-600 mt-1">
                          4th avenue - Ibn Battuta st - Al-furjan<br />
                          Dubai, UAE
                        </p>
                        
                        <Button className="mt-4 w-full" variant="outline">
                          <MapPin className="mr-2 h-4 w-4" /> Get Directions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                    <h3 className="font-semibold text-lg mb-4">Connect With Us</h3>
                    <div className="flex gap-3">
                      <a 
                        href="https://facebook.com/talkastranger" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                        </svg>
                      </a>
                      <a 
                        href="https://t.me/talkastranger" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.356 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                  <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                  
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Your name" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="your@email.com" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="How can we help you?" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Please provide as much detail as possible..."
                        className="min-h-[150px]"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="privacy" className="rounded text-primary" />
                      <label htmlFor="privacy" className="text-sm text-slate-600">
                        I agree to the <a href="/privacy-policy" className="text-primary hover:underline">privacy policy</a> and <a href="/terms-of-service" className="text-primary hover:underline">terms of service</a>.
                      </label>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </Button>
                  </form>
                </div>
                
                <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-100">
                  <h3 className="font-semibold text-lg mb-3">Frequently Asked Questions</h3>
                  <p className="text-slate-600 mb-4">
                    Check our <a href="/faq" className="text-primary hover:underline">FAQ section</a> for quick answers to common questions. 
                    If you can't find what you're looking for, please don't hesitate to contact us directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;