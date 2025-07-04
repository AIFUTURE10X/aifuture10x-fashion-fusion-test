import { PROCESSING_STAGES, PROCESSING_TIME_RANGE } from './constants';

export const createProcessingSimulation = (): Promise<void> => {
  return new Promise<void>(resolve => {
    let progress = 0;
    
    // Random timing between 4-7 seconds total
    const totalTime = PROCESSING_TIME_RANGE.MIN + Math.random() * (PROCESSING_TIME_RANGE.MAX - PROCESSING_TIME_RANGE.MIN);
    const stageTime = totalTime / PROCESSING_STAGES.length;
    
    const interval = setInterval(() => {
      progress += (100 / PROCESSING_STAGES.length);
      const stageIndex = Math.floor(progress / (100 / PROCESSING_STAGES.length)) - 1;
      if (stageIndex >= 0 && stageIndex < PROCESSING_STAGES.length) {
        console.log(`📋 Processing: ${PROCESSING_STAGES[stageIndex]} (${Math.round(progress)}%)`);
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        resolve();
      }
    }, stageTime);
  });
};