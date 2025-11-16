/**
 * Global type definitions
 */

// Add ethers to the window object
interface Window {
  ethereum?: any;
  ethers?: any;
  Buffer?: any;
}

// Make TypeScript aware of our polyfills
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    // Add other environment variables as needed
  }
  
  interface Process {
    env: ProcessEnv;
  }
}

declare var process: NodeJS.Process;

// Override Buffer for browser compatibility
interface SafeBuffer {
  from: (data: any, encoding?: string) => Uint8Array;
  alloc: (size: number) => Uint8Array;
  isBuffer: (obj: any) => boolean;
}

declare var Buffer: SafeBuffer;