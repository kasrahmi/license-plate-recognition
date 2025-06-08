// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';

import API_BASE_URL from '../config';

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

const AdminPanel = () => {
  const navigate = useNavigate();
  const [plates, setPlates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const openModal = () => {
    addForm.resetFields();
    setIsModalOpen(true);
  };

const onAddPlate = async (values) => {
  const newPlate = values.plate.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/plates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plate: newPlate }),
    });

    if (!res.ok) {
      const err = await res.json();
      message.error(err.error || 'Failed to add plate');
      return;
    }

    setPlates(prev => [...prev, { key: newPlate, plate: newPlate, authorized: false }]);
    message.success(`Added plate "${newPlate}"`);
    setIsModalOpen(false);
  } catch (err) {
    message.error('Server error');
  }
};


const toggleAuthorized = async (record) => {
  try {
  const res = await fetch(`${API_BASE_URL}/plates/${record.plate}`, {
      method: 'PATCH',
    });

    if (res.ok) {
      setPlates(prev =>
        prev.map(p =>
          p.plate === record.plate ? { ...p, authorized: !p.authorized } : p
        )
      );
      message.success(`${record.plate} is now ${!record.authorized ? 'Authorized' : 'Denied'}`);
    } else {
      message.error('Failed to toggle');
    }
  } catch (err) {
    message.error('Server error');
  }
};


  useEffect(() => {
  fetch(`${API_BASE_URL}/plates`)
    .then(res => res.json())
    .then(data => {
      const formatted = data.map((item, index) => ({
        key: item.plate,
        plate: item.plate,
        authorized: item.authorized === 'True',
      }));
      setPlates(formatted);
    })
    .catch(err => {
      console.error('Failed to load plates:', err);
      message.error('Could not load plates');
    });
}, []);


const deletePlate = async (record) => {
  try {
    const res = await fetch(`${API_BASE_URL}/plates/${record.plate}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setPlates(prev => prev.filter(p => p.plate !== record.plate));
      message.success(`Deleted plate "${record.plate}"`);
    } else {
      message.error('Failed to delete');
    }
  } catch (err) {
    message.error('Server error');
  }
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
