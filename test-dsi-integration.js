// Test script for Defect Severity Index API integration
// Run with: node test-dsi-integration.js

async function testDSIAPI() {
  console.log('🧪 Testing Defect Severity Index API Integration...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const testProjectIds = [1, 2, 3]; // Test multiple project IDs
  
  for (const projectId of testProjectIds) {
    // Test the working endpoint from your example
    const url = `${API_BASE_URL}/dashboard/dsi/${projectId}`;
    
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
          console.log(`📊 Project ID: ${data.data.projectId}`);
          console.log(`📊 Total Defects: ${data.data.totalDefects}`);
          console.log(`📊 DSI Percentage: ${data.data.dsiPercentage}%`);
          console.log(`📊 Interpretation: ${data.data.interpretation}`);
          console.log(`📊 Actual Score: ${data.data.actualSeverityScore}`);
          console.log(`📊 Maximum Score: ${data.data.maximumSeverityScore}`);
          
          // Test color mapping
          const dsiPercentage = data.data.dsiPercentage;
          let expectedColor = '';
          
          if (dsiPercentage >= 0 && dsiPercentage <= 25) {
            expectedColor = '#16A34A'; // Green
          } else if (dsiPercentage >= 26 && dsiPercentage <= 50) {
            expectedColor = '#D97706'; // Yellow
          } else if (dsiPercentage >= 51 && dsiPercentage <= 75) {
            expectedColor = '#DC2626'; // Red
          } else if (dsiPercentage >= 76 && dsiPercentage <= 100) {
            expectedColor = '#7C2D12'; // Dark Red
          }
          
          console.log(`🎨 Expected Color: ${expectedColor}`);
          console.log(`📊 DSI Formula Verification:`);
          console.log(`   Actual Score: ${data.data.actualSeverityScore}`);
          console.log(`   Maximum Score: ${data.data.maximumSeverityScore}`);
          console.log(`   Calculated %: ${((data.data.actualSeverityScore / data.data.maximumSeverityScore) * 100).toFixed(1)}%`);
          console.log(`   API %: ${data.data.dsiPercentage}%`);
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

testDSIAPI();
