import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const ButtonTest = () => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = () => {
    console.log("Button clicked!");
    toast({
      title: "Button Works!",
      description: "The button click was detected successfully"
    });
    setShowDialog(true);
  };

  const handleLoadingButtonClick = () => {
    console.log("Loading button clicked!");
    setIsLoading(true);
    
    // Simulate some activity
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Loading Complete",
        description: "The loading button worked correctly"
      });
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto">
        <Link href="/create-token" className="flex items-center text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Token Creation
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Button Testing Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-blue-700 text-sm">
                This is a dedicated page to test button functionality. If buttons work here
                but not on the main page, we can isolate the issue to the form context.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Standard Button Test</h3>
              <Button onClick={handleButtonClick} className="w-full bg-green-600 hover:bg-green-700">
                Test Button (Click Me)
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Loading Button Test</h3>
              <Button 
                onClick={handleLoadingButtonClick} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">○</span>
                    Loading...
                  </>
                ) : (
                  "Test Loading State"
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Simple Link Button</h3>
              <a 
                href="#" 
                className="block w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded text-center"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Link button clicked");
                  toast({
                    title: "Link Button Works",
                    description: "The raw HTML link button click was detected"
                  });
                }}
              >
                HTML Link Test
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Success Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-green-600">
              <Check className="h-5 w-5 mr-2" />
              Button Test Successful!
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>The button click was detected and processed correctly!</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-green-700">
                  This confirms that basic button functionality is working in this isolated environment.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ButtonTest;