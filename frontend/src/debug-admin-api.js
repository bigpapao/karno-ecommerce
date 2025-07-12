import { adminService } from './services/admin.service';

async function debugAdminAPI() {
  try {
    console.log('🔍 Debug: Testing Admin API from Frontend Context...\n');

    const response = await adminService.getDashboardStats();
    
    console.log('📊 Raw Response:', response);
    console.log('📊 Response Type:', typeof response);
    console.log('📊 Response Keys:', Object.keys(response));
    
    // Check different possible paths
    console.log('🔄 Testing different data paths:');
    console.log('  response.data:', response.data);
    console.log('  response.data.data:', response.data?.data);
    console.log('  response.categoryCount:', response.categoryCount);
    console.log('  response.data.categoryCount:', response.data?.categoryCount);
    console.log('  response.data.data.categoryCount:', response.data?.data?.categoryCount);
    
    console.log('🔄 Brand count paths:');
    console.log('  response.brandCount:', response.brandCount);
    console.log('  response.data.brandCount:', response.data?.brandCount);
    console.log('  response.data.data.brandCount:', response.data?.data?.brandCount);

  } catch (error) {
    console.error('❌ Error testing admin API:', error);
  }
}

// Run the debug function
debugAdminAPI(); 