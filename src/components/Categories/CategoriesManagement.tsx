import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Modal, 
  Form, 
  Select,
  Space,
  Popconfirm,
  Switch,
  Row,
  Col,
  InputNumber,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  FolderOutlined,
  TagOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;

interface Category {
  id: string;
  name: string;
  parent: string | null;
  status: 'active' | 'inactive';
  order: number;
  parentName?: string;
}

const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiService.categories.getAll();
      
      // Add parent name to categories for display
      const categoriesWithParentName = response.map((category: Category) => {
        const parent = response.find((cat: Category) => cat.id === category.parent);
        return {
          ...category,
          parentName: parent ? parent.name : null
        };
      });
      
      setCategories(categoriesWithParentName);
    } catch (error) {
      showNotification('error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalVisible(true);
    form.setFieldsValue(category);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await apiService.categories.delete(categoryId);
      showNotification('success', 'Category deleted successfully');
      fetchCategories();
    } catch (error) {
      showNotification('error', 'Failed to delete category');
    }
  };

  const handleStatusToggle = async (categoryId: string, checked: boolean) => {
    try {
      await apiService.categories.update(categoryId, { 
        status: checked ? 'active' : 'inactive' 
      });
      showNotification('success', 'Category status updated');
      fetchCategories();
    } catch (error) {
      showNotification('error', 'Failed to update category status');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        await apiService.categories.update(editingCategory.id, values);
        showNotification('success', 'Category updated successfully');
      } else {
        await apiService.categories.create(values);
        showNotification('success', 'Category created successfully');
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      showNotification('error', 'Failed to save category');
    }
  };

  const getParentCategories = () => {
    return categories.filter(cat => cat.parent === null);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <div className="flex items-center space-x-2">
          {record.parent ? <TagOutlined /> : <FolderOutlined />}
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: 'Parent Category',
      dataIndex: 'parentName',
      key: 'parentName',
      render: (parentName: string) => (
        parentName ? <Tag color="blue">{parentName}</Tag> : <span className="text-gray-400">Root Category</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Category) => (
        <Switch
          checked={status === 'active'}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      sorter: (a: Category, b: Category) => a.order - b.order,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Category) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
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

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Categories Management</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add Category
          </Button>
        </div>

        <div className="mb-4">
          <Input.Search
            placeholder="Search categories..."
            allowClear
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'active', order: 1 }}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please input the category name!' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          
          <Form.Item
            name="parent"
            label="Parent Category"
            help="Leave empty for root category"
          >
            <Select placeholder="Select parent category" allowClear>
              {getParentCategories().map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                name="order"
                label="Sort Order"
                rules={[{ required: true, message: 'Please input the sort order!' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="1"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;