// Test script for Severity Summary API
// Run with: node test-severity-api.js

async function testSeverityAPI() {
  console.log('🧪 Testing Severity Summary API...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const projectId = 1;
  const url = `${API_BASE_URL}/dashboard/defect_severity_summary/${projectId}`;
  
  console.log('📡 Making request to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      return;
    }
    
    const responseData = await response.json();
    console.log('✅ Raw API response:');
    console.log(JSON.stringify(responseData, null, 2));
    
    // Validate response structure
    if (responseData.status === 'success' && responseData.statusCode === 2000) {
      console.log('✅ API response is valid');
      
      if (responseData.data) {
        console.log('📊 Data validation:');
        console.log('  - Project ID:', responseData.data.projectId);
        console.log('  - Project Name:', responseData.data.projectName);
        console.log('  - Total Defects:', responseData.data.totalDefects);
        console.log('  - Defect Summary Items:', responseData.data.defectSummary?.length || 0);
        
        if (responseData.data.defectSummary && responseData.data.defectSummary.length > 0) {
          console.log('📊 Severity breakdown:');
          responseData.data.defectSummary.forEach(item => {
            console.log(`  - ${item.severity}: ${item.total} defects (${item.Severity_color})`);
          });
        }
      } else {
        console.warn('⚠️ No data in response');
      }
    } else {
      console.error('❌ API returned non-success status:', responseData.status, responseData.statusCode);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('❌ Network error - check if the server is running and accessible');
    }
  }
}

testSeverityAPI();
