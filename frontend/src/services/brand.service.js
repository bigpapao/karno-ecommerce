import api from './api';

const USE_MOCK = false; // Set to true for development with mock data

// Mock data for development
const mockBrands = [
  {
    _id: 'brand1',
    name: 'سایپا',
    slug: 'saipa',
    description: 'شرکت سایپا - تولیدکننده خودروهای ایرانی',
    logo: '/images/brands/saipa.png',
    website: 'https://saipa.com',
    country: 'ایران',
    isActive: true,
    featured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand2',
    name: 'ایران خودرو',
    slug: 'iran-khodro',
    description: 'شرکت ایران خودرو - بزرگترین خودروساز ایران',
    logo: '/images/brands/iran-khodro.png',
    website: 'https://ikco.com',
    country: 'ایران',
    isActive: true,
    featured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand3',
    name: 'MVM',
    slug: 'mvm',
    description: 'شرکت MVM - تولیدکننده خودروهای چینی در ایران',
    logo: '/images/brands/mvm.png',
    website: 'https://mvm.ir',
    country: 'چین',
    isActive: true,
    featured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand4',
    name: 'بهمن موتور',
    slug: 'bahman-motor',
    description: 'شرکت بهمن موتور - تولیدکننده خودروهای تجاری',
    logo: '/images/brands/bahman-motor.png',
    website: 'https://bahmanmotor.com',
    country: 'ایران',
    isActive: true,
    featured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand5',
    name: 'بوش',
    slug: 'bosch',
    description: 'تولیدکننده قطعات یدکی با کیفیت آلمانی',
    logo: '/images/brands/bosch.png',
    website: 'https://bosch.com',
    country: 'آلمان',
    isActive: true,
    featured: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand6',
    name: 'شل',
    slug: 'shell',
    description: 'تولیدکننده روغن‌های موتور با کیفیت',
    logo: '/images/brands/shell.png',
    website: 'https://shell.com',
    country: 'هلند',
    isActive: true,
    featured: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'brand7',
    name: 'واریان',
    slug: 'varian',
    description: 'تولیدکننده باتری خودرو',
    logo: '/images/brands/varian.png',
    website: 'https://varian.ir',
    country: 'ایران',
    isActive: true,
    featured: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Helper function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const brandService = {
  // Get all brands
  getBrands: async (params = {}) => {
    if (USE_MOCK) {
      await delay(300);
      
      let filteredBrands = [...mockBrands];
      
      // Apply search filter
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredBrands = filteredBrands.filter(brand =>
          brand.name.toLowerCase().includes(searchTerm) ||
          brand.description.toLowerCase().includes(searchTerm) ||
          brand.country.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply active filter
      if (params.isActive !== undefined) {
        filteredBrands = filteredBrands.filter(brand =>
          brand.isActive === params.isActive
        );
      }
      
      // Apply featured filter
      if (params.featured !== undefined) {
        filteredBrands = filteredBrands.filter(brand =>
          brand.featured === params.featured
        );
      }
      
      // Pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedBrands = filteredBrands.slice(startIndex, endIndex);
      
      return {
        brands: paginatedBrands,
        pagination: {
          total: filteredBrands.length,
          page: page,
          limit: limit,
          pages: Math.ceil(filteredBrands.length / limit)
        }
      };
    }

    // TEMPORARY FIX: Use fetch instead of axios to avoid redirect loop
    try {
      // Making brands API call with fetch to avoid redirect loop
      
      // Build query string
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const url = `http://localhost:5000/api/v1/brands${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      // Fetching brands from API endpoint
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Brands fetched successfully
      
      // Return the expected format for the admin component
      return {
        brands: data.data?.brands || [],
        pagination: data.data?.pagination || {}
      };
    } catch (error) {
      // Error fetching brands handled by caller
      throw error;
    }
  },

  // Get single brand by ID
  getBrand: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      const brand = mockBrands.find(b => b._id === id);
      if (!brand) {
        throw new Error('Brand not found');
      }
      return brand;
    }

    // TEMPORARY FIX: Use fetch instead of axios to avoid redirect loop
    try {
      // Making brand API call with fetch
      
      const url = `http://localhost:5000/api/v1/brands/${id}`;
      // Fetching brand from API endpoint
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Brand fetched successfully
      
      // Return the brand data directly
      return data.data || data;
    } catch (error) {
      // Error fetching brand handled by caller
      throw error;
    }
  },

  // Create new brand
  createBrand: async (brandData) => {
    if (USE_MOCK) {
      await delay(500);
      const newBrand = {
        _id: Date.now().toString(),
        ...brandData,
        slug: brandData.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockBrands.push(newBrand);
      return newBrand;
    }

    try {
      const response = await api.post('/brands', brandData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error creating brand handled by caller
      throw error;
    }
  },

  // Update existing brand
  updateBrand: async (id, brandData) => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockBrands.findIndex(b => b._id === id);
      if (index === -1) {
        throw new Error('Brand not found');
      }
      mockBrands[index] = {
        ...mockBrands[index],
        ...brandData,
        updatedAt: new Date().toISOString()
      };
      return mockBrands[index];
    }

    try {
      const response = await api.put(`/brands/${id}`, brandData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      // Error updating brand handled by caller
      throw error;
    }
  },

  // Delete brand
  deleteBrand: async (id) => {
    if (USE_MOCK) {
      await delay(400);
      const index = mockBrands.findIndex(b => b._id === id);
      if (index === -1) {
        throw new Error('Brand not found');
      }
      mockBrands.splice(index, 1);
      return { message: 'Brand deleted successfully' };
    }

    try {
      const response = await api.delete(`/brands/${id}`);
      return response.data;
    } catch (error) {
      // Error deleting brand handled by caller
      throw error;
    }
  },

  // Get featured brands
  getFeaturedBrands: async (limit = 10) => {
    if (USE_MOCK) {
      await delay(300);
      const featured = mockBrands.filter(b => b.featured && b.isActive).slice(0, limit);
      return { brands: featured };
    }

    try {
      const response = await api.get('/brands/featured', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      // Error fetching featured brands handled by caller
      throw error;
    }
  },

  // Get brands by country
  getBrandsByCountry: async (country) => {
    if (USE_MOCK) {
      await delay(200);
      const brands = mockBrands.filter(b => 
        b.country.toLowerCase() === country.toLowerCase() && b.isActive
      );
      return { brands };
    }

    try {
      const response = await api.get(`/brands/country/${country}`);
      return response.data;
    } catch (error) {
      // Error fetching brands by country handled by caller
      throw error;
    }
  },

  // Search brands
  searchBrands: async (query) => {
    if (USE_MOCK) {
      return this.getBrands({ search: query });
    }

    try {
      const response = await api.get('/brands/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      // Error searching brands handled by caller
      throw error;
    }
  }
};

export default brandService; 