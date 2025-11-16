import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Copy, ExternalLink, Loader2, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeploymentControl() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    setDeployResult(null);

    try {
      const response = await fetch('/api/deploy/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setDeployResult(data);
        toast({
          title: 'Success!',
          description: 'Code pushed to GitHub successfully'
        });
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Command copied to clipboard'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-purple-500/50">
          <CardHeader>
            <CardTitle className="text-3xl">🚀 TalkAStranger Deployment</CardTitle>
            <CardDescription>
              Deploy your platform to Digital Ocean in 2 easy steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Push to GitHub */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold">Push Code to GitHub</h3>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !!deployResult}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                data-testid="button-deploy-github"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pushing to GitHub...
                  </>
                ) : deployResult ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Code Pushed Successfully
                  </>
                ) : (
                  'Push to GitHub Now'
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {deployResult && (
                <Alert className="bg-green-50 border-green-500">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-2">
                      <p className="font-semibold">✓ Code successfully pushed to GitHub!</p>
                      <div className="flex items-center gap-2">
                        <a
                          href={deployResult.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View Repository <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Step 2: Deploy to Digital Ocean */}
            {deployResult && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold">Deploy to Digital Ocean</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    SSH into your droplet and run this ONE command to deploy:
                  </p>

                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm relative group">
                    <code className="break-all">
                      {deployResult.nextSteps.step2}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(deployResult.nextSteps.step2)}
                      data-testid="button-copy-deploy-command"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      How to connect via SSH:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Open your terminal</li>
                      <li>
                        Run:{' '}
                        <code className="bg-gray-200 px-2 py-1 rounded">
                          ssh root@209.97.153.135
                        </code>
                      </li>
                      <li>Enter your root password (from Digital Ocean email)</li>
                      <li>Paste and run the deployment command above</li>
                      <li>Wait 2-3 minutes for installation</li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <p className="font-semibold mb-2">⚠️ Important: Set up environment variables</p>
                      <p className="text-sm">
                        After the script runs, you'll need to edit the <code className="bg-gray-200 px-1 rounded">.env</code> file
                        with your actual credentials (DATABASE_URL, PRIVATE_KEY, etc.)
                      </p>
                      <p className="text-sm mt-2">
                        Run: <code className="bg-gray-200 px-1 rounded">nano /var/www/talkastranger/.env</code>
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Deployment Info */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Deployment Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Droplet IP:</span>
                  <p className="font-mono">209.97.153.135</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target URL:</span>
                  <p className="font-mono">http://209.97.153.135</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Droplet ID:</span>
                  <p className="font-mono">530452293</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="text-green-600 font-semibold">Active</p>
                </div>
              </div>
            </div>

            {/* After Deployment */}
            {deployResult && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🎉 After Deployment</h4>
                <p className="text-sm">
                  Once the deployment command completes successfully, your TalkAStranger platform
                  will be live at{' '}
                  <a
                    href="http://209.97.153.135"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline font-semibold"
                  >
                    http://209.97.153.135
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
