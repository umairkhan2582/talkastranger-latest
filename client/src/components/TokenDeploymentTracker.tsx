import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DeploymentStep = {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  timestamp?: Date;
};

export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface TokenDeploymentDetail {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress?: string;
  transactionHash?: string;
  status: DeploymentStatus;
  steps: DeploymentStep[];
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  supply?: number;
}

// For simulating updates from backend
let intervalId: NodeJS.Timeout | null = null;

interface TokenDeploymentTrackerProps {
  deployment: TokenDeploymentDetail;
  onUpdate?: (updatedDeployment: TokenDeploymentDetail) => void;
  onComplete?: (completedDeployment: TokenDeploymentDetail) => void;
  autoSimulate?: boolean;
}

export const TokenDeploymentTracker: React.FC<TokenDeploymentTrackerProps> = ({ 
  deployment,
  onUpdate,
  onComplete,
  autoSimulate = false
}) => {
  const [currentDeployment, setCurrentDeployment] = useState<TokenDeploymentDetail>(deployment);
  
  // Calculate overall progress percentage
  const calculateProgress = () => {
    const total = currentDeployment.steps.length;
    const completed = currentDeployment.steps.filter(step => step.status === 'completed').length;
    return Math.round((completed / total) * 100);
  };
  
  // Get current status text
  const getStatusText = (status: DeploymentStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: DeploymentStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get step icon based on status
  const getStepIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Simulate deployment progress (for development/testing)
  const simulateDeploymentProgress = () => {
    // Skip simulation if deployment is already complete or failed
    if (currentDeployment.status === 'completed' || currentDeployment.status === 'failed') {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }
    
    // Find the first pending step
    const pendingStepIndex = currentDeployment.steps.findIndex(step => step.status === 'pending');
    
    if (pendingStepIndex === -1) {
      // All steps completed
      const updatedDeployment: TokenDeploymentDetail = {
        ...currentDeployment,
        status: 'completed' as DeploymentStatus,
        completedAt: new Date()
      };
      setCurrentDeployment(updatedDeployment);
      
      if (onComplete) {
        onComplete(updatedDeployment);
      }
      
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }
    
    // Mark step as in_progress
    const updatedSteps = [...currentDeployment.steps];
    updatedSteps[pendingStepIndex] = {
      ...updatedSteps[pendingStepIndex],
      status: 'in_progress',
      timestamp: new Date()
    };
    
    // Update deployment with in_progress step
    const updatedDeployment: TokenDeploymentDetail = {
      ...currentDeployment,
      status: 'in_progress' as DeploymentStatus,
      steps: updatedSteps
    };
    
    setCurrentDeployment(updatedDeployment);
    
    if (onUpdate) {
      onUpdate(updatedDeployment);
    }
    
    // Simulate completing the step after a delay
    setTimeout(() => {
      // For demo purposes, make all steps succeed
      // We'll disable the random failure chance for now
      const stepFailed = false; // Force success for all steps
      
      const completedSteps = [...updatedSteps];
      completedSteps[pendingStepIndex] = {
        ...completedSteps[pendingStepIndex],
        status: stepFailed ? 'failed' : 'completed',
        timestamp: new Date()
      };
      
      // If a step failed, mark the whole deployment as failed
      const finalDeployment: TokenDeploymentDetail = {
        ...currentDeployment,
        status: stepFailed ? 'failed' as DeploymentStatus : 'in_progress' as DeploymentStatus,
        steps: completedSteps,
        errorMessage: stepFailed ? `Failed at step: ${completedSteps[pendingStepIndex].name}` : undefined
      };
      
      setCurrentDeployment(finalDeployment);
      
      if (onUpdate) {
        onUpdate(finalDeployment);
      }
      
      // If failed, stop simulation
      if (stepFailed && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        
        if (onComplete) {
          onComplete(finalDeployment);
        }
      }
    }, 1500 + Math.random() * 1500); // Shorter random delay between 1.5-3 seconds
  };
  
  // Start/stop simulation based on props
  useEffect(() => {
    if (autoSimulate && !intervalId) {
      // Initial call to start the simulation
      simulateDeploymentProgress();
      
      // Set up interval for subsequent steps
      intervalId = setInterval(simulateDeploymentProgress, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [autoSimulate, currentDeployment.status]);
  
  return (
    <Card className="w-full border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{currentDeployment.tokenName} Token Deployment</CardTitle>
            <CardDescription>
              Deploying {currentDeployment.tokenSymbol} token to the blockchain
            </CardDescription>
          </div>
          <Badge className={getStatusColor(currentDeployment.status)}>
            {getStatusText(currentDeployment.status)}
          </Badge>
        </div>
        <Progress value={calculateProgress()} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        {currentDeployment.errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
            <div className="flex gap-2 items-center font-semibold">
              <AlertCircle className="h-5 w-5" />
              Error
            </div>
            <p className="mt-1 text-sm">{currentDeployment.errorMessage}</p>
          </div>
        )}
        
        {/* Token details */}
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Token Name:</span> {currentDeployment.tokenName}
          </p>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Token Symbol:</span> {currentDeployment.tokenSymbol}
          </p>
          {currentDeployment.tokenAddress && (
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Token Address:</span>{" "}
              <a
                href={`https://tasonscan.com/explorer?txhash=${currentDeployment.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {currentDeployment.tokenAddress.substring(0, 6)}...{currentDeployment.tokenAddress.substring(currentDeployment.tokenAddress.length - 4)}
              </a>
            </p>
          )}
          {currentDeployment.transactionHash && (
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Transaction:</span>{" "}
              <a
                href={`https://tasonscan.com/explorer?txhash=${currentDeployment.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {currentDeployment.transactionHash.substring(0, 6)}...{currentDeployment.transactionHash.substring(currentDeployment.transactionHash.length - 4)}
              </a>
            </p>
          )}
        </div>
        
        {/* Steps */}
        <ul className="space-y-3">
          {currentDeployment.steps.map((step) => (
            <li key={step.id} className="flex items-start gap-3 p-3 rounded-md border">
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <h3 className="font-medium">{step.name}</h3>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">{formatTime(step.timestamp)}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ul>
        
        {/* Timing info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Started: {formatTime(currentDeployment.createdAt)}</p>
          {currentDeployment.completedAt && (
            <p>Completed: {formatTime(currentDeployment.completedAt)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to create default deployment steps
export const createDefaultDeploymentSteps = (
  tokenName: string,
  tokenSymbol: string
): DeploymentStep[] => {
  return [
    {
      id: 'approve',
      name: 'Approve TAS Spending',
      status: 'pending',
      description: 'Approving TAS tokens to be used for token creation'
    },
    {
      id: 'create',
      name: 'Create Token Contract', 
      status: 'pending',
      description: `Deploying ${tokenName} (${tokenSymbol}) contract to the blockchain`
    },
    {
      id: 'index',
      name: 'Index Token', 
      status: 'pending',
      description: 'Adding token to the blockchain index and verifying'
    },
    {
      id: 'initialize',
      name: 'Initialize Token Parameters', 
      status: 'pending',
      description: 'Setting up token parameters like initial price and bonding curve'
    },
    {
      id: 'register',
      name: 'Register on TAS Platform', 
      status: 'pending',
      description: 'Adding token to TAS platform for trading and discovery'
    }
  ];
};

// Helper function to create an initial deployment object
export const createInitialDeployment = (
  tokenName: string,
  tokenSymbol: string,
  supply: number
): TokenDeploymentDetail => {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    tokenName,
    tokenSymbol,
    status: 'pending' as DeploymentStatus,
    steps: createDefaultDeploymentSteps(tokenName, tokenSymbol),
    createdAt: new Date(),
    supply
  };
};