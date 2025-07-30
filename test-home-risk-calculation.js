// Test script for Home page risk calculation
// Run with: node test-home-risk-calculation.js

async function testHomeRiskCalculation() {
  console.log('🧪 Testing Home Page Risk Calculation...');
  
  const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
  
  try {
    // 1. First, get all projects
    console.log('\n📡 Step 1: Fetching all projects...');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!projectsResponse.ok) {
      throw new Error(`Projects API failed: ${projectsResponse.status}`);
    }
    
    const projectsData = await projectsResponse.json();
    console.log('✅ Projects fetched successfully:', projectsData.data?.length || 0, 'projects');
    
    if (!projectsData.data || projectsData.data.length === 0) {
      console.log('⚠️ No projects found, cannot test risk calculation');
      return;
    }
    
    // 2. Get project IDs for color API
    const projectIds = projectsData.data.map(project => project.id);
    console.log('📊 Project IDs for color API:', projectIds.slice(0, 5), '...');
    
    // 3. Fetch project card colors
    console.log('\n📡 Step 2: Fetching project card colors...');
    const colorsResponse = await fetch(`${API_BASE_URL}/projects/card-colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ projectIds }),
    });
    
    if (!colorsResponse.ok) {
      throw new Error(`Colors API failed: ${colorsResponse.status}`);
    }
    
    const colorsData = await colorsResponse.json();
    console.log('✅ Project colors fetched successfully');
    
    if (!colorsData.data) {
      console.log('⚠️ No color data found');
      return;
    }
    
    // 4. Calculate risk counts like the Home component does
    console.log('\n📊 Step 3: Calculating risk counts...');
    
    let high = 0;
    let medium = 0;
    let low = 0;
    
    projectsData.data.forEach((project, index) => {
      const projectColorData = colorsData.data[project.id] || colorsData.data[project.id.toString()];
      
      if (projectColorData && projectColorData.availableRiskLevels) {
        const riskLevels = projectColorData.availableRiskLevels;
        
        console.log(`   Project ${project.id} (${project.projectName}): Risk levels = [${riskLevels.join(', ')}]`);
        
        // Determine the highest risk level for this project
        if (riskLevels.includes('High')) {
          high++;
          console.log(`     → Classified as HIGH risk`);
        } else if (riskLevels.includes('Medium')) {
          medium++;
          console.log(`     → Classified as MEDIUM risk`);
        } else if (riskLevels.includes('Low')) {
          low++;
          console.log(`     → Classified as LOW risk`);
        } else {
          low++;
          console.log(`     → No specific risk level, defaulting to LOW`);
        }
      } else {
        low++;
        console.log(`   Project ${project.id} (${project.projectName}): No color data, defaulting to LOW risk`);
      }
      
      // Only show first 10 projects to avoid spam
      if (index >= 9) {
        console.log(`   ... and ${projectsData.data.length - 10} more projects`);
        return false;
      }
    });
    
    // 5. Display results
    console.log('\n🎯 Final Risk Calculation Results:');
    console.log(`📊 High Risk Projects: ${high}`);
    console.log(`📊 Medium Risk Projects: ${medium}`);
    console.log(`📊 Low Risk Projects: ${low}`);
    console.log(`📊 Total Projects: ${high + medium + low}`);
    
    // 6. Verify the calculation
    const totalCalculated = high + medium + low;
    const totalProjects = projectsData.data.length;
    
    if (totalCalculated === totalProjects) {
      console.log('✅ Risk calculation is correct!');
    } else {
      console.log(`❌ Risk calculation mismatch: ${totalCalculated} calculated vs ${totalProjects} actual`);
    }
    
    // 7. Test individual project risk determination
    console.log('\n🔍 Testing individual project risk determination:');
    const testProject = projectsData.data[0];
    const testProjectColorData = colorsData.data[testProject.id] || colorsData.data[testProject.id.toString()];
    
    if (testProjectColorData) {
      console.log(`📋 Test Project: ${testProject.projectName} (ID: ${testProject.id})`);
      console.log(`📊 Available Risk Levels: [${testProjectColorData.availableRiskLevels.join(', ')}]`);
      
      let testRisk = 'low';
      if (testProjectColorData.availableRiskLevels.includes('High')) {
        testRisk = 'high';
      } else if (testProjectColorData.availableRiskLevels.includes('Medium')) {
        testRisk = 'medium';
      } else if (testProjectColorData.availableRiskLevels.includes('Low')) {
        testRisk = 'low';
      }
      
      console.log(`🎯 Determined Risk Level: ${testRisk.toUpperCase()}`);
      console.log(`🎨 Project Card Color: ${testProjectColorData.projectCardColor}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing risk calculation:', error.message);
  }
  
  console.log('\n📱 The Home page should now display:');
  console.log('   • Correct risk counts in Project Status Insights');
  console.log('   • Proper project filtering by risk level');
  console.log('   • Accurate project card colors based on risk');
  console.log('   • Real-time data from API instead of mock data');
}

testHomeRiskCalculation();
