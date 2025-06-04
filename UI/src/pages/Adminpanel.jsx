import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Table,
  Button,
  Card,
  Popconfirm,
  message,
  Tag
} from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoadingReqs(true);
    try {
      // Real API call:
      // const res = await fetch('/api/requests?status=pending', { headers: { Authorization: `Bearer ${token}` } });
      // const data = await res.json();

      // MOCKED for demo:
      const data = [
        {
          id: 5,
          userId: 17,
          username: 'user1',
          plate: 'XYZ789',
          action: 'add',
          requestedStatus: null,
          createdAt: '2025-05-20T14:32:00Z'
        },
        {
          id: 6,
          userId: 42,
          username: 'user2',
          plate: 'DEF456',
          action: 'update',
          requestedStatus: 'Authorized',
          createdAt: '2025-05-21T09:15:00Z'
        }
      ];

      setRequests(data);
    } catch (err) {
      message.error('Failed to load pending requests');
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const approveRequest = async (requestId) => {
    try {
      // await fetch(`/api/requests/${requestId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({ status: 'approved' })
      // });
      message.success(`Approved request #${requestId}`);
      fetchPendingRequests();
    } catch (err) {
      message.error('Failed to approve');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      // await fetch(`/api/requests/${requestId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify({ status: 'rejected' })
      // });
      message.error(`Rejected request #${requestId}`);
      fetchPendingRequests();
    } catch (err) {
      message.error('Failed to reject');
    }
  };

  const columns = [
    {
      title: 'Plate',
      dataIndex: 'plate',
      key: 'plate'
    },
    {
      title: 'Requested By',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={action === 'add' ? 'green' : 'blue'}>
          {action.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Desired Status',
      dataIndex: 'requestedStatus',
      key: 'requestedStatus',
      render: (status, record) =>
        record.action === 'update' ? (
          <Tag>{status || '—'}</Tag>
        ) : (
          <Tag>—</Tag>
        )
    },
    {
      title: 'Requested At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (ts) => new Date(ts).toLocaleString('en-GB')
    },
    {
      title: 'Approve',
      key: 'approve',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => approveRequest(record.id)}
        >
          Approve
        </Button>
      )
    },
    {
      title: 'Reject',
      key: 'reject',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to reject?"
          onConfirm={() => rejectRequest(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger>Reject</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
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
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Pending Requests</Menu.Item>
          <Menu.Item
            key="2"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main Content */}
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }} />
        <Content style={{ margin: '16px' }}>
          <Card title="User Plate Requests" bordered={false}>
            <Table
              dataSource={requests.map(r => ({
                key: r.id,
                ...r
              }))}
              columns={columns}
              loading={loadingReqs}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPanel;
