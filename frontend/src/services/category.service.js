import api from './api';

const USE_MOCK = false; // Set to true for development with mock data

// Mock data for development
const mockCategories = [
  {
    _id: 'cat1',
    name: 'موتور',
    slug: 'motor',
    description: 'قطعات مربوط به موتور خودرو',
    image: '/images/categories/motor.jpg',
    parentCategory: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'cat2',
    name: 'ترمز',
    slug: 'brake',
    description: 'سیستم ترمز و قطعات مربوطه',
    image: '/images/categories/brake.jpg',
    parentCategory: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'cat3',
    name: 'برق خودرو',
    slug: 'electrical',
    description: 'سیستم برق و الکترونیک خودرو',
    image: '/images/categories/electrical.jpg',
    parentCategory: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'cat4',
    name: 'سیستم تعلیق',
    slug: 'suspension',
    description: 'قطعات سیستم تعلیق و فنربندی',
    image: '/images/categories/suspension.jpg',
    parentCategory: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'cat5',
    name: 'بدنه',
    slug: 'body',
    description: 'قطعات بدنه و نمای خودرو',
    image: '/images/categories/body.jpg',
    parentCategory: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Helper function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const categoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    if (USE_MOCK) {
      await delay(300);
      
      let filteredCategories = [...mockCategories];
      
      // Apply search filter
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredCategories = filteredCategories.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply active filter
      if (params.isActive !== undefined) {
        filteredCategories = filteredCategories.filter(category =>
          category.isActive === params.isActive
        );
      }
      
      // Pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
      
      return {
        categories: paginatedCategories,
        pagination: {
          total: filteredCategories.length,
          page: page,
          limit: limit,
          pages: Math.ceil(filteredCategories.length / limit)
        }
      };
    }

    try {
      // Making categories API call with fetch to avoid redirect loop
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const url = `http://localhost:5000/api/v1/categories${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      // Fetching categories from API endpoint
      
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
      // Categories fetched successfully
      
      // Return the expected format for the admin component
      return {
        categories: data.data || [],
        pagination: data.pagination || { total: data.results || 0 }
      };
    } catch (error) {
      // Error fetching categories handled by caller
      throw error;
    }
  },

  // Get single category by ID
  getCategory: async (id) => {
    if (USE_MOCK) {
      await delay(200);
      const category = mockCategories.find(c => c._id === id);
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    }

    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      // Error fetching category handled by caller
      throw error;
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    if (USE_MOCK) {
      await delay(500);
      const newCategory = {
        _id: Date.now().toString(),
        ...categoryData,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCategories.push(newCategory);
      return newCategory;
    }

    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      // Error creating category handled by caller
      throw error;
    }
  },

  // Update existing category
  updateCategory: async (id, categoryData) => {
    if (USE_MOCK) {
      await delay(500);
      const index = mockCategories.findIndex(c => c._id === id);
      if (index === -1) {
        throw new Error('Category not found');
      }
      mockCategories[index] = {
        ...mockCategories[index],
        ...categoryData,
        updatedAt: new Date().toISOString()
      };
      return mockCategories[index];
    }

    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      // Error updating category handled by caller
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    if (USE_MOCK) {
      await delay(400);
      const index = mockCategories.findIndex(c => c._id === id);
      if (index === -1) {
        throw new Error('Category not found');
      }
      mockCategories.splice(index, 1);
      return { message: 'Category deleted successfully' };
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      // Error deleting category handled by caller
      throw error;
    }
  },

  // Get category tree (hierarchical structure)
  getCategoryTree: async () => {
    if (USE_MOCK) {
      await delay(300);
      // For mock data, we'll return a simple flat structure
      // In real implementation, this would build a tree structure
      return {
        categories: mockCategories.filter(c => !c.parentCategory)
      };
    }

    try {
      const response = await api.get('/categories/tree');
      return response.data;
    } catch (error) {
      // Error fetching category tree handled by caller
      throw error;
    }
  },

  // Get subcategories of a parent category
  getSubcategories: async (parentId) => {
    if (USE_MOCK) {
      await delay(200);
      const subcategories = mockCategories.filter(c => c.parentCategory === parentId);
      return { categories: subcategories };
    }

    try {
      const response = await api.get(`/categories/${parentId}/subcategories`);
      return response.data;
    } catch (error) {
      // Error fetching subcategories handled by caller
      throw error;
    }
  }
};

export default categoryService;
