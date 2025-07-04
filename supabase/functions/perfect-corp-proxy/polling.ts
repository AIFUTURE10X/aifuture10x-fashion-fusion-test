
import { PERFECTCORP_BASE_URL } from './constants.ts';
import { WorkingEndpoints } from './endpoint-discovery.ts';

export async function pollTaskCompletion(accessToken: string, taskId: string, workingEndpoints?: WorkingEndpoints): Promise<any> {
  console.log('Step 4: Polling for task completion with S2S API...');
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating completed task with realistic delay');
    const processingTime = 15000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const validMockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hRny4QAAAAABJRU5ErkJggg=';
    
    return {
      status: 'success',
      result: {
        output_url: `data:image/png;base64,${validMockImage}`,
        result_image_url: `data:image/png;base64,${validMockImage}`
      },
      processing_time: Math.round(processingTime / 1000)
    };
  }
  
  const statusUrl = `${PERFECTCORP_BASE_URL}/task/clothes/${taskId}`;
  console.log('🎯 [Polling] Using official Perfect Corp endpoint:', statusUrl);
  const maxAttempts = 60;
  const pollingInterval = 1000;
  
  console.log(`Starting S2S polling for task ${taskId}, max ${maxAttempts} attempts`);
  console.log('S2S Status URL:', statusUrl);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
    
    try {
      console.log(`S2S Polling attempt ${attempt + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(`S2S Status response: ${statusResponse.status}`);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`S2S Status data:`, JSON.stringify(statusData, null, 2));
        
        const status = statusData.result?.status || statusData.status;
        
        if (status === 'success') {
          console.log('S2S Task completed successfully');
          return statusData;
        } else if (status === 'error' || status === 'failed') {
          const errorMsg = statusData.result?.error || statusData.error || 'Unknown error';
          console.error(`S2S Task failed with status: ${status}, error: ${errorMsg}`);
          throw new Error(`S2S Task failed: ${errorMsg}`);
        } else if (status === 'running') {
          console.log(`S2S Task still running (attempt ${attempt + 1})`);
        } else {
          console.log(`S2S Unknown status: ${status}, continuing to poll`);
        }
      } else {
        const errorText = await statusResponse.text();
        console.error(`S2S Status check failed: ${statusResponse.status} - ${errorText}`);
        
        if (statusResponse.status === 404) {
          throw new Error('S2S Task not found - it may have timed out or been cancelled');
        }
        
        if (attempt > maxAttempts - 5) {
          throw new Error(`S2S Status check consistently failing: ${statusResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`S2S Status check error on attempt ${attempt + 1}:`, error);
      
      if (error.message.includes('Task failed') || error.message.includes('Task not found')) {
        throw error;
      }
      
      if (attempt > maxAttempts - 5) {
        throw new Error(`S2S Polling failed after ${attempt + 1} attempts: ${error.message}`);
      }
    }
  }

  throw new Error(`S2S Task timed out after ${maxAttempts} seconds`);
}
