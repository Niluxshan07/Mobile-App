// Simple test to verify the GetProjectCardColor API integration
// This can be run with node to test the API without React Native

// Test function using fetch (similar to our implementation)
async function testProjectCardColorAPI() {
  console.log('🧪 Testing Project Card Color API Integration...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const testProjectId = 1; // Test with a sample project ID
  const url = `${API_BASE_URL}/dashboard/project-card-color/${testProjectId}`;
  
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
      console.log('🎨 Project:', responseData.data.projectName);
      console.log('🎨 Project ID:', responseData.data.projectId);
      console.log('🎨 Card Color:', responseData.data.projectCardColor);
      console.log('🎨 Risk Levels:', responseData.data.availableRiskLevels);
      
      // Test color conversion
      const convertGradientToRNStyle = (gradientColor) => {
        if (gradientColor.includes('red')) {
          return '#DC2626'; // Red
        } else if (gradientColor.includes('yellow') || gradientColor.includes('amber')) {
          return '#D97706'; // Yellow/Amber
        } else if (gradientColor.includes('green')) {
          return '#16A34A'; // Green
        } else if (gradientColor.includes('blue')) {
          return '#2563EB'; // Blue
        } else if (gradientColor.includes('purple')) {
          return '#9333EA'; // Purple
        } else if (gradientColor.includes('gray') || gradientColor.includes('grey')) {
          return '#6B7280'; // Gray
        }
        return '#6B7280'; // Gray
      };
      
      const convertedColor = convertGradientToRNStyle(responseData.data.projectCardColor);
      console.log('🎨 Converted Color:', convertedColor);
      
    } else {
      console.log('⚠️ API returned error:', responseData.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Test multiple project IDs
async function testMultipleProjects() {
  console.log('🧪 Testing multiple projects...');
  const projectIds = [1, 2, 3];
  
  for (const projectId of projectIds) {
    console.log(`\n--- Testing Project ID: ${projectId} ---`);
    await testProjectCardColorAPI(projectId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
}

// Test the API integration
console.log('Starting Project Card Color API Integration Test...');
testProjectCardColorAPI();
