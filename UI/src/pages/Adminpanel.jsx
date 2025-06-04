// src/pages/AdminPanel.jsx
import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Switch,
  Popconfirm,
  message
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// ← Import the new Plate component
import Plate from '../components/Plate';

const { Header, Content, Sider } = Layout;
let nextId = 1;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [plates, setPlates] = useState([
    { id: nextId++, plate: 'ABC123', authorized: true },
    { id: nextId++, plate: 'XYZ789', authorized: false }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const openModal = () => {
    addForm.resetFields();
    setIsModalOpen(true);
  };

  const onAddPlate = (values) => {
    const existing = plates.find((p) => p.plate === values.plate.trim());
    if (existing) {
      message.error('That plate is already in the list');
      return;
    }
    setPlates((prev) => [
      ...prev,
      { id: nextId++, plate: values.plate.trim(), authorized: false }
    ]);
    message.success(`Added plate "${values.plate.trim()}"`);
    setIsModalOpen(false);
  };

  const toggleAuthorized = (record) => {
    setPlates((prev) =>
      prev.map((p) =>
        p.id === record.id ? { ...p, authorized: !p.authorized } : p
      )
    );
    message.info(
      `${record.plate} is now ${
        record.authorized ? 'Denied' : 'Authorized'
      }`
    );
  };

  const deletePlate = (record) => {
    setPlates((prev) => prev.filter((p) => p.id !== record.id));
    message.success(`Deleted plate "${record.plate}"`);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // Here’s the only change: render <Plate /> instead of plain text
  const columns = [
    {
      title: 'Plate',
      dataIndex: 'plate',
      key: 'plate',
      render: (_, record) => (
        <Plate text={record.plate} authorized={record.authorized} />
      )
    },
    {
      title: 'Authorized?',
      dataIndex: 'authorized',
      key: 'authorized',
      render: (auth, record) => (
        <Switch
          checked={auth}
          onChange={() => toggleAuthorized(record)}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title={`Delete "${record.plate}"?`}
          onConfirm={() => deletePlate(record)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div
          style={{
            height: 32,
            margin: 16,
            color: 'white',
            textAlign: 'center',
            fontSize: '1.25rem'
          }}
        >
          Admin Panel
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['logout']}>
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openModal}
          >
            Add Plate
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
          <Card title="Plates List" bordered={false}>
            <Table
              dataSource={plates.map((p) => ({ key: p.id, ...p }))}
              columns={columns}
              pagination={false}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title="Add a New Plate"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={addForm} layout="vertical" onFinish={onAddPlate}>
          <Form.Item
            label="Plate Number"
            name="plate"
            rules={[
              { required: true, message: 'Please enter a plate number' },
              {
                pattern: /^[A-Z0-9]{1,8}$/,
                message:
                  'Use only uppercase letters/numbers (max 8 chars)'
              }
            ]}
          >
            <Input placeholder="e.g. GHI789" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Plate
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminPanel;
