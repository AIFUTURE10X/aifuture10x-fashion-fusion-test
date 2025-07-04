
import { PERFECTCORP_BASE_URL } from './constants.ts';
import { WorkingEndpoints } from './endpoint-discovery.ts';

export async function startTryOnTask(
  accessToken: string, 
  userPhotoFileId: string, 
  clothingFileId: string, 
  isCustomClothing?: boolean, 
  perfectCorpRefId?: string,
  garmentCategory: string = 'upper_body',
  workingEndpoints?: WorkingEndpoints
): Promise<string> {
  console.log('Step 3: Starting try-on task with S2S API...');
  console.log('Using user photo file_id:', userPhotoFileId);
  console.log('Using clothing file_id:', clothingFileId);
  
  if (accessToken === 'mock_token_for_testing') {
    console.log('Mock mode: Simulating try-on task');
    return 'mock_task_id_67890';
  }
  
  const tryOnUrl = `${PERFECTCORP_BASE_URL}/task/clothes`;
  console.log('🎯 [Try-On] Using official Perfect Corp endpoint:', tryOnUrl);
  
  const requestBody = {
    file_id: userPhotoFileId, // User photo file_id from Perfect Corp File API
    garment_category: garmentCategory,
    ref_ids: [clothingFileId] // Clothing file_id from Perfect Corp File API
  };

  try {
    console.log('Sending try-on request to S2S endpoint:', tryOnUrl);
    console.log('S2S Request body:', JSON.stringify(requestBody));
    
    const tryOnResponse = await fetch(tryOnUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`S2S Try-on response status: ${tryOnResponse.status}`);

    if (tryOnResponse.ok) {
      const tryOnData = await tryOnResponse.json();
      console.log('S2S Try-on response data:', tryOnData);
      
      const taskId = tryOnData.result?.task_id || tryOnData.task_id || tryOnData.id;
      if (taskId) {
        console.log('S2S Try-on task started successfully, task_id:', taskId);
        return taskId;
      } else {
        console.error('No task_id found in S2S try-on response');
      }
    }
    
    const errorText = await tryOnResponse.text();
    console.error('S2S Try-on failed:', tryOnResponse.status, errorText);
    throw new Error(`S2S Try-on failed: ${tryOnResponse.status} - ${errorText}`);
    
  } catch (error) {
    console.error('S2S Try-on error:', error);
    throw new Error(`S2S Try-on task failed: ${error.message}`);
  }
}
