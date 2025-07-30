// Simple test to verify the GetSeveritySummary API integration
// This can be run with node to test the API without React Native

// Test function using fetch (similar to our implementation)
async function testSeveritySummaryAPI() {
  console.log('🧪 Testing Severity Summary API Integration...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const testProjectId = 1; // Test with a sample project ID
  const url = `${API_BASE_URL}/dashboard/defect_severity_summary/${testProjectId}`;
  
  try {
    console.log('📡 Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (!response.ok) {
      console.log('❌ HTTP Error:', response.status, response.statusText);
      return;
    }
    
    const responseData = await response.json();
    console.log('📊 Response data:', JSON.stringify(responseData, null, 2));
    
    if (responseData.status === 'success' && responseData.statusCode === 2000) {
      console.log('✅ API test successful!');
      console.log('📈 Project:', responseData.data.projectName);
      console.log('📈 Total defects:', responseData.data.totalDefects);
      console.log('📈 Severity items:', responseData.data.defectSummary?.length);
      
      if (responseData.data.defectSummary) {
        responseData.data.defectSummary.forEach((item, index) => {
          console.log(`📈 ${index + 1}. ${item.severity} (${item.Severity_color}): ${item.total} defects`);
          console.log(`   - Open: ${item.statuses.Open}, Fixed: ${item.statuses.Fixed}, Retest: ${item.statuses.Retest}, Closed: ${item.statuses.Closed}`);
        });
      }
    } else {
      console.log('⚠️ API returned error:', responseData.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test the API integration
console.log('Starting API Integration Test...');
testSeveritySummaryAPI();
