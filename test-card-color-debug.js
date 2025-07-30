// Debug test for Project Card Color API
// Run with: node test-card-color-debug.js

// Simple fetch test without external dependencies
async function testProjectCardColorAPI() {
  console.log('🧪 Testing Project Card Color API...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const testProjectIds = [1, 2, 3]; // Test multiple project IDs
  
  for (const projectId of testProjectIds) {
    const url = `${API_BASE_URL}/dashboard/project-card-color/${projectId}`;
    
    try {
      console.log(`\n📡 Testing Project ID ${projectId}:`);
      console.log(`📡 URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.data) {
          console.log(`🎨 Project: ${data.data.projectName}`);
          console.log(`🎨 Card Color: ${data.data.projectCardColor}`);
          console.log(`🎨 Risk Levels: ${data.data.availableRiskLevels?.join(', ')}`);
          
          // Test color conversion
          const convertGradientToRNStyle = (gradientColor) => {
            console.log(`🔍 Testing color conversion for: "${gradientColor}"`);
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
            return '#6B7280'; // Gray (default)
          };
          
          const convertedColor = convertGradientToRNStyle(data.data.projectCardColor);
          console.log(`🎨 Converted Color: ${convertedColor}`);
        }
      } else {
        const errorData = await response.json();
        console.log('❌ Error Response:');
        console.log(JSON.stringify(errorData, null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Network Error for Project ${projectId}:`, error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testProjectCardColorAPI();
