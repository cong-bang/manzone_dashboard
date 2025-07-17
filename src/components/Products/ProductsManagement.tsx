import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  message, 
  Popconfirm,
  Image,
  Tag,
  Upload,
  InputNumber,
  Row,
  Col,
  Divider,
  Spin,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { adminProductService, Product, CreateProductRequest, UpdateProductRequest, ProductListParams } from '../../services/adminProductService';
import { adminCategoryService, Category } from '../../services/adminCategoryService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;
const { TextArea } = Input;

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: ProductListParams = {
        page: pagination.current - 1,
        size: pagination.pageSize,
        sortBy: 'CREATED_AT',
        sortDir: 'DESC'
      };

      if (searchText) {
        params.searchString = searchText;
      }

      if (categoryFilter !== 'all') {
        params.categoryId = categoryFilter as number;
      }

      const response = await adminProductService.getAllProducts(params);
      
      if (response.success) {
        setProducts(response.data.content);
        setPagination(prev => ({ 
          ...prev, 
          total: response.data.totalElements 
        }));
      } else {
        showNotification('error', response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
      
      if (errorMessage.includes('UNAUTHORIZED')) {
        showNotification('error', 'Please login again');
        // Redirect to login or refresh token
      } else if (errorMessage.includes('ACCESS_DENIED')) {
        showNotification('error', 'You do not have permission to access this resource');
      } else {
        showNotification('error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await adminCategoryService.getAllCategories({
        page: 0,
        size: 10,
        sortBy: 'NAME',
        sortDir: 'ASC'
      });
      
      if (response.success) {
        setCategories(response.data.content);
      } else {
        showNotification('error', response.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('error', 'Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId
    });
    
    // Convert imageUrls to file list for Upload component
    const imageFiles = product.imageUrls?.map((url: string, index: number) => ({
      uid: String(index),
      name: `image_${index}`,
      status: 'done',
      url: url
    })) || [];
    
    setFileList(imageFiles);
  };

  const handleDelete = async (productId: number) => {
    try {
      const response = await adminProductService.deleteProduct(productId);
      
      if (response.success) {
        showNotification('success', 'Product deleted successfully');
        fetchProducts();
      } else {
        showNotification('error', response.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      
      if (errorMessage.includes('PRODUCT_NOT_FOUND')) {
        showNotification('error', 'Product not found');
      } else if (errorMessage.includes('CANNOT_DELETE_PRODUCT')) {
        showNotification('error', 'Cannot delete this product. It may be referenced by other records.');
      } else {
        showNotification('error', errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selectedRowKeys.map(id => 
        adminProductService.deleteProduct(Number(id))
      );
      
      await Promise.all(deletePromises);
      
      showNotification('success', `${selectedRowKeys.length} products deleted successfully`);
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      showNotification('error', 'Failed to delete some products');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Extract image URLs from fileList
      const imageUrls = fileList
        .filter(file => file.status === 'done')
        .map(file => file.url || file.response?.url)
        .filter(url => url);

      const productData = {
        name: values.name,
        description: values.description || '',
        price: values.price,
        categoryId: values.categoryId,
        imageUrls: imageUrls
      };

      let response;
      if (editingProduct) {
        response = await adminProductService.updateProduct(editingProduct.id, productData as UpdateProductRequest);
      } else {
        response = await adminProductService.createProduct(productData as CreateProductRequest);
      }

      if (response.success) {
        showNotification('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setModalVisible(false);
        fetchProducts();
      } else {
        showNotification('error', response.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      
      if (errorMessage.includes('PRODUCT_NAME_ALREADY_EXISTS')) {
        showNotification('error', 'A product with this name already exists');
      } else if (errorMessage.includes('INVALID_PRICE')) {
        showNotification('error', 'Please enter a valid price');
      } else if (errorMessage.includes('INVALID_CATEGORY')) {
        showNotification('error', 'Please select a valid category');
      } else {
        showNotification('error', errorMessage);
      }
    }
  };

  const handleViewDetails = async (product: Product) => {
    try {
      // Fetch full product details
      const response = await adminProductService.getProductById(product.id);
      if (response.success) {
        setSelectedProduct(response.data);
        setDetailModalVisible(true);
      } else {
        showNotification('error', 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      showNotification('error', 'Failed to fetch product details');
    }
  };

  const handleImageUpload = (info: any) => {
    let newFileList = [...info.fileList];
    
    // Limit to 5 images
    newFileList = newFileList.slice(-5);
    
    // Update file status and add preview URL
    newFileList = newFileList.map(file => {
      if (file.response) {
        file.url = file.response.url;
      } else if (!file.url && file.originFileObj) {
        file.url = URL.createObjectURL(file.originFileObj);
      }
      return file;
    });
    
    setFileList(newFileList);
  };

  const handleExport = () => {
    try {
      const csvContent = products.map(product => ({
        ID: product.id,
        Name: product.name,
        Description: product.description,
        Price: product.price,
        Category: categories.find(cat => cat.id === product.categoryId)?.name || 'Unknown',
        'Image Count': product.imageUrls?.length || 0,
        'Created At': product.createdAt,
        'Updated At': product.updatedAt
      }));
      
      const csvString = [
        Object.keys(csvContent[0]).join(','),
        ...csvContent.map(row => Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('success', 'Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      showNotification('error', 'Failed to export products');
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'No Category';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrls',
      key: 'imageUrls',
      width: 80,
      render: (imageUrls: string[]) => (
        <Image
          width={60}
          height={60}
          src={imageUrls?.[0] || 'https://via.placeholder.com/60x60?text=No+Image'}
          alt="Product"
          className="object-cover rounded"
          fallback="https://via.placeholder.com/60x60?text=No+Image"
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId: number) => (
        <Tag color="blue">{getCategoryName(categoryId)}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price?.toLocaleString() || 0} đ`,
      sorter: true,
      width: 100,
    },
    {
      title: 'Images',
      dataIndex: 'imageUrls',
      key: 'imageCount',
      render: (imageUrls: string[]) => (
        <Tag color="green">{imageUrls?.length || 0} images</Tag>
      ),
      width: 100,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Product) => (
        <Space>
          <Button 
            type="primary" 
            ghost
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchProducts}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={() => showNotification('info', 'Import functionality coming soon')}
            >
              Import
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={products.length === 0}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Add Product
            </Button>
          </Space>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <Input.Search
            placeholder="Search products..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            loading={loading}
          />
          <Select
            placeholder="Filter by category"
            style={{ width: 200 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            loading={categoriesLoading}
          >
            <Option value="all">All Categories</Option>
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <Space>
                <span>{selectedRowKeys.length} selected</span>
                <Popconfirm
                  title={`Are you sure you want to delete ${selectedRowKeys.length} products?`}
                  onConfirm={handleBulkDelete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />} size="small">
                    Bulk Delete
                  </Button>
                </Popconfirm>
              </Space>
            }
            type="info"
            className="mb-4"
          />
        )}

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} products`,
            onChange: (page, size) => 
              setPagination(prev => ({ ...prev, current: page, pageSize: size })),
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: 'Please input the product name!' },
                  { min: 2, message: 'Product name must be at least 2 characters' },
                  { max: 100, message: 'Product name must be less than 100 characters' }
                ]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: 'Please select a category!' }]}
              >
                <Select 
                  placeholder="Select category"
                  loading={categoriesLoading}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input the description!' },
              { min: 10, message: 'Description must be at least 10 characters' },
              { max: 1000, message: 'Description must be less than 1000 characters' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter product description" 
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price (đ)"
            rules={[
              { required: true, message: 'Please input the price!' },
              { type: 'number', min: 0.01, message: 'Price must be greater than 0' }
            ]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              placeholder="0.00"
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item label="Product Images" help="Maximum 5 images allowed">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleImageUpload}
              beforeUpload={() => false} // Prevent auto upload
              maxCount={5}
              accept="image/*"
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        title="Product Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0 ? (
                  <Image.PreviewGroup>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.imageUrls.map((image: string, index: number) => (
                        <Image
                          key={index}
                          width={100}
                          height={100}
                          src={image}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          className="object-cover rounded"
                          fallback="https://via.placeholder.com/100x100?text=No+Image"
                        />
                      ))}
                    </div>
                  </Image.PreviewGroup>
                ) : (
                  <div className="text-center text-gray-500">
                    No images available
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                <div className="space-y-2">
                  <div>
                    <strong>Category:</strong> {getCategoryName(selectedProduct.categoryId)}
                  </div>
                  <div>
                    <strong>Price:</strong> {selectedProduct.price?.toLocaleString()} đ
                  </div>
                  <div>
                    <strong>Images:</strong> {selectedProduct.imageUrls?.length || 0} images
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedProduct.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Updated:</strong> {new Date(selectedProduct.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsManagement;