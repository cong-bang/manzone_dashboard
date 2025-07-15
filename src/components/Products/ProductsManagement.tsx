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
  Switch,
  Row,
  Col,
  Checkbox,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;
const { TextArea } = Input;

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const { showNotification } = useNotification();

  const categories = [
    'Watches', 'Wallets', 'Belts', 'Sunglasses', 'Ties', 'Cufflinks', 'Rings', 'Bracelets'
  ];

  const colors = ['Black', 'Brown', 'Blue', 'Red', 'Green', 'Gray', 'White', 'Silver', 'Gold'];
  const materials = ['Leather', 'Metal', 'Fabric', 'Plastic', 'Wood', 'Ceramic', 'Titanium'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

  useEffect(() => {
    fetchProducts();
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiService.products.getAll(
        pagination.current,
        pagination.pageSize,
        searchText
      );
      setProducts(response.data);
      setPagination(prev => ({ ...prev, total: response.total }));
    } catch (error) {
      showNotification('error', 'Failed to fetch products');
    } finally {
      setLoading(false);
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

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setModalVisible(true);
    form.setFieldsValue({
      ...product,
      images: product.images || []
    });
    setFileList(product.images?.map((url: string, index: number) => ({
      uid: String(index),
      name: `image_${index}`,
      status: 'done',
      url: url
    })) || []);
  };

  const handleDelete = async (productId: string) => {
    try {
      await apiService.products.delete(productId);
      showNotification('success', 'Product deleted successfully');
      fetchProducts();
    } catch (error) {
      showNotification('error', 'Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiService.products.bulkDelete(selectedRowKeys);
      showNotification('success', `${selectedRowKeys.length} products deleted successfully`);
      setSelectedRowKeys([]);
      fetchProducts();
    } catch (error) {
      showNotification('error', 'Failed to delete products');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const productData = {
        ...values,
        images: fileList.map(file => file.url || file.response?.url || file.thumbUrl)
      };

      if (editingProduct) {
        await apiService.products.update(editingProduct.id, productData);
        showNotification('success', 'Product updated successfully');
      } else {
        await apiService.products.create(productData);
        showNotification('success', 'Product created successfully');
      }
      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      showNotification('error', 'Failed to save product');
    }
  };

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const handleImageUpload = (info: any) => {
    let newFileList = [...info.fileList];
    
    // Limit to 5 images
    newFileList = newFileList.slice(-5);
    
    // Add mock URL for demo
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
    // Mock export functionality
    const csvContent = products.map(product => ({
      ID: product.id,
      Name: product.name,
      Category: product.category,
      Price: product.price,
      Stock: product.stock,
      Status: product.status
    }));
    
    const csvString = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('success', 'Products exported successfully');
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      render: (images: string[]) => (
        <Image
          width={60}
          height={60}
          src={images?.[0] || 'https://via.placeholder.com/60x60'}
          alt="Product"
          className="object-cover rounded"
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price}`,
      sorter: true,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
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
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          <Space>
            <Button
              icon={<ImportOutlined />}
              onClick={() => showNotification('info', 'Import functionality coming soon')}
            >
              Import
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
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
          />
          <Select
            placeholder="Filter by category"
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            <Option value="all">All Categories</Option>
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>

        {selectedRowKeys.length > 0 && (
          <div className="mb-4">
            <Space>
              <span>{selectedRowKeys.length} selected</span>
              <Popconfirm
                title={`Are you sure you want to delete ${selectedRowKeys.length} products?`}
                onConfirm={handleBulkDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Bulk Delete
                </Button>
              </Popconfirm>
            </Space>
          </div>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
            onChange: (page, size) => setPagination(prev => ({ ...prev, current: page, pageSize: size })),
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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'active', stock: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please input the product name!' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category!' }]}
              >
                <Select placeholder="Select category">
                  {categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the description!' }]}
          >
            <TextArea rows={4} placeholder="Enter product description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price ($)"
                rules={[{ required: true, message: 'Please input the price!' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="Stock Quantity"
                rules={[{ required: true, message: 'Please input the stock quantity!' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select a status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Product Attributes</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="color" label="Color">
                <Select placeholder="Select color">
                  {colors.map(color => (
                    <Option key={color} value={color}>{color}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="material" label="Material">
                <Select placeholder="Select material">
                  {materials.map(material => (
                    <Option key={material} value={material}>{material}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="size" label="Size">
                <Select placeholder="Select size">
                  {sizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Product Images">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleImageUpload}
              beforeUpload={() => false}
              maxCount={5}
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
              {editingProduct ? 'Update' : 'Create'}
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
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <Image.PreviewGroup>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.images.map((image: string, index: number) => (
                        <Image
                          key={index}
                          width={100}
                          height={100}
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="object-cover rounded"
                        />
                      ))}
                    </div>
                  </Image.PreviewGroup>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-2">{selectedProduct.description}</p>
                <div className="space-y-2">
                  <div><strong>Category:</strong> {selectedProduct.category}</div>
                  <div><strong>Price:</strong> ${selectedProduct.price}</div>
                  <div><strong>Stock:</strong> {selectedProduct.stock}</div>
                  <div><strong>Status:</strong> 
                    <Tag color={selectedProduct.status === 'active' ? 'green' : 'default'} className="ml-2">
                      {selectedProduct.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedProduct.attributes && (
              <div>
                <h4 className="font-semibold mb-2">Attributes:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.attributes.color && (
                    <div><strong>Color:</strong> {selectedProduct.attributes.color}</div>
                  )}
                  {selectedProduct.attributes.material && (
                    <div><strong>Material:</strong> {selectedProduct.attributes.material}</div>
                  )}
                  {selectedProduct.attributes.size && (
                    <div><strong>Size:</strong> {selectedProduct.attributes.size}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsManagement;