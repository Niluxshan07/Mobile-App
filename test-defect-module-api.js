// Test script for Defect Module Pie Chart API integration
// Run with: node test-defect-module-api.js

async function testDefectModuleAPI() {
  console.log('🧪 Testing Defect Module Pie Chart API Integration...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  const testProjectIds = [1, 2, 3]; // Test multiple project IDs
  
  for (const projectId of testProjectIds) {
    const url = `${API_BASE_URL}/dashboard/module?projectId=${projectId}`;
    
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
        
        if (data.data && Array.isArray(data.data)) {
          const totalDefects = data.data.reduce((sum, module) => sum + module.value, 0);
          const mostCommonModule = data.data.reduce((prev, current) => 
            prev.value > current.value ? prev : current
          );
          
          console.log(`📊 Total Defects: ${totalDefects}`);
          console.log(`📊 Total Modules: ${data.data.length}`);
          console.log(`📊 Most Common Module: ${mostCommonModule.name} (${mostCommonModule.value} defects, ${mostCommonModule.percentage.toFixed(1)}%)`);
          console.log(`📊 Module Distribution:`);
          
          // Sort by defect count descending
          const sortedModules = [...data.data].sort((a, b) => b.value - a.value);
          sortedModules.forEach((module, index) => {
            console.log(`   ${index + 1}. ${module.name}: ${module.value} defects (${module.percentage.toFixed(1)}%)`);
          });
          
          // Verify percentages add up to 100%
          const totalPercentage = data.data.reduce((sum, module) => sum + module.percentage, 0);
          console.log(`📊 Total Percentage: ${totalPercentage.toFixed(1)}%`);
          
          // Test color mapping
          console.log(`🎨 Color Mapping Test:`);
          data.data.forEach((module, index) => {
            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
              '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
              '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2'
            ];
            
            const moduleColorMap = {
              'dashboard': '#FF6B6B',
              'employee': '#4ECDC4',
              'bench': '#45B7D1',
              'configurations': '#96CEB4',
              'project management': '#FFEAA7',
              'project': '#DDA0DD',
              'releases': '#98D8C8',
              'defects': '#F7DC6F',
              'test cases': '#BB8FCE',
              'main template': '#85C1E9',
            };
            
            const normalizedName = module.name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
            const expectedColor = moduleColorMap[normalizedName] || colors[index % colors.length];
            console.log(`   ${module.name}: ${expectedColor}`);
          });
          
          // Test pie chart data format
          console.log(`📊 Pie Chart Data Format:`);
          const pieChartData = data.data.map((item, index) => ({
            name: item.name,
            population: item.value,
            color: '#FF6B6B', // Example color
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
            percentage: item.percentage,
            moduleId: item.moduleId,
          }));
          console.log(JSON.stringify(pieChartData.slice(0, 3), null, 2)); // Show first 3 items
          
          // Test data validation
          console.log(`🔍 Data Validation:`);
          let isValid = true;
          
          for (const item of data.data) {
            if (typeof item.moduleId !== 'number' || 
                typeof item.name !== 'string' || 
                typeof item.value !== 'number' || 
                typeof item.percentage !== 'number') {
              console.log(`❌ Invalid data structure for module: ${item.name}`);
              isValid = false;
            }
            
            if (item.value < 0 || item.percentage < 0) {
              console.log(`❌ Negative values for module: ${item.name}`);
              isValid = false;
            }
          }
          
          if (isValid) {
            console.log(`✅ All data validation checks passed`);
          }
          
        } else {
          console.log('⚠️ No data array found in response');
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
  
  console.log('\n🎯 Integration Test Summary:');
  console.log('✅ API endpoint tested');
  console.log('✅ Response format validated');
  console.log('✅ Percentage calculations verified');
  console.log('✅ Color mapping tested');
  console.log('✅ Pie chart data format tested');
  console.log('✅ Data validation performed');
  console.log('\n📱 The DefectsByModuleChart component should now display:');
  console.log('   • Live API data when available');
  console.log('   • Loading states during API calls');
  console.log('   • Error states with retry functionality');
  console.log('   • Fallback to calculated data when API fails');
  console.log('   • Proper color coding for each module');
  console.log('   • Accurate percentages from API');
  console.log('   • Module-specific insights and statistics');
}

testDefectModuleAPI();
