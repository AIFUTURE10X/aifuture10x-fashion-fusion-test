// Realistic processing time simulation for better UX

export interface ProcessingStage {
  name: string;
  duration: number; // milliseconds
  message: string;
}

export const PROCESSING_STAGES: ProcessingStage[] = [
  { name: 'validation', duration: 500, message: 'Validating image...' },
  { name: 'upload', duration: 1500, message: 'Uploading to Perfect Corp...' },
  { name: 'analysis', duration: 2000, message: 'Analyzing image content...' },
  { name: 'processing', duration: 3000, message: 'Processing AI try-on...' },
  { name: 'rendering', duration: 2000, message: 'Rendering final result...' },
  { name: 'optimization', duration: 1000, message: 'Optimizing output...' }
];

export class ProcessingSimulator {
  private currentStage = 0;
  private startTime = Date.now();
  
  constructor(private onProgress?: (stage: ProcessingStage, progress: number) => void) {}
  
  async simulateProcessing(): Promise<void> {
    console.log('⏱️ [Processing Simulation] Starting realistic processing simulation...');
    
    for (let i = 0; i < PROCESSING_STAGES.length; i++) {
      const stage = PROCESSING_STAGES[i];
      this.currentStage = i;
      
      console.log(`📋 [Processing Simulation] Stage ${i + 1}/${PROCESSING_STAGES.length}: ${stage.message}`);
      
      // Report progress
      const progress = ((i + 1) / PROCESSING_STAGES.length) * 100;
      this.onProgress?.(stage, progress);
      
      // Simulate processing time with some randomness
      const variance = stage.duration * 0.3; // 30% variance
      const actualDuration = stage.duration + (Math.random() - 0.5) * variance;
      
      await this.delay(actualDuration);
    }
    
    const totalTime = Date.now() - this.startTime;
    console.log(`✅ [Processing Simulation] Completed in ${totalTime}ms`);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getCurrentStage(): ProcessingStage | null {
    return PROCESSING_STAGES[this.currentStage] || null;
  }
  
  getProgress(): number {
    return ((this.currentStage + 1) / PROCESSING_STAGES.length) * 100;
  }
  
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

// Simulate realistic processing delays for different operations
export async function simulateUploadDelay(): Promise<void> {
  const delay = 1000 + Math.random() * 2000; // 1-3 seconds
  console.log(`⏱️ [Upload Simulation] Simulating upload delay: ${delay.toFixed(0)}ms`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function simulateTryOnDelay(): Promise<void> {
  const delay = 3000 + Math.random() * 4000; // 3-7 seconds
  console.log(`⏱️ [Try-On Simulation] Simulating AI processing delay: ${delay.toFixed(0)}ms`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function simulateAuthDelay(): Promise<void> {
  const delay = 500 + Math.random() * 1000; // 0.5-1.5 seconds
  console.log(`⏱️ [Auth Simulation] Simulating authentication delay: ${delay.toFixed(0)}ms`);
  await new Promise(resolve => setTimeout(resolve, delay));
}