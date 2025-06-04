import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Table,
  Button,
  Card,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

/**
 * Dashboard: shows only the plates belonging to the logged‐in user.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const userId = Number(sessionStorage.getItem('userId'));

  // State to hold the user’s plates (fetched from backend)
  const [plates, setPlates] = useState([]);
  const [loadingPlates, setLoadingPlates] = useState(false);

  // State for “Request New Plate” modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newForm] = Form.useForm();

  // State for “Request Update” modal (which needs to know which row)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm] = Form.useForm();
  const [currentRow, setCurrentRow] = useState(null);

  // Fetch the user’s plates when Dashboard mounts
  useEffect(() => {
    fetchUserPlates();
  }, []);

  const fetchUserPlates = async () => {
    setLoadingPlates(true);
    try {
      // Replace this with a real fetch:
      // const res = await fetch(`/api/plates?userId=${userId}`);
      // const data = await res.json();

      // MOCKED response (for demo):
      const data = [
        { id: 101, plate: 'ABC123', status: 'Authorized' },
        { id: 102, plate: 'XYZ789', status: 'Pending' }
      ];

      setPlates(data);
    } catch (err) {
      message.error('Failed to load your plates');
    } finally {
      setLoadingPlates(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // 1) OPEN “Request New Plate” modal
  const openNewModal = () => {
    newForm.resetFields();
    setIsNewModalOpen(true);
  };

  // 2) SUBMIT the “New Plate” form
  const submitNewPlate = async (values) => {
    // values = { plate: 'ABC123' }
    try {
      // Real request would be:
      // await fetch('/api/requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId, plate: values.plate, action: 'add' })
      // });
      //
      // For now, mock success:
      message.success(`Requested new plate: ${values.plate}`);
      setIsNewModalOpen(false);
      // Optionally, refresh “pending” status in your local list:
      fetchUserPlates();
    } catch (err) {
      message.error('Failed to send request');
    }
  };

  // 3) OPEN “Request Update” modal for a specific row
  const openUpdateModal = (row) => {
    setCurrentRow(row);
    updateForm.setFieldsValue({ plate: row.plate, newStatus: row.status });
    setIsUpdateModalOpen(true);
  };

  // 4) SUBMIT the “Update Plate” form
  const submitUpdatePlate = async (values) => {
    // values = { plate: 'ABC123', newStatus: 'Authorized' }
    try {
      // Real request:
      // await fetch('/api/requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId,
      //     plate: values.plate,
      //     action: 'update',
      //     requestedStatus: values.newStatus
      //   })
      // });
      message.info(`Requested update for ${values.plate}`);
      setIsUpdateModalOpen(false);
      fetchUserPlates();
    } catch (err) {
      message.error('Failed to send update request');
    }
  };

  const columns = [
    { title: 'License Plate', dataIndex: 'plate', key: 'plate' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => openUpdateModal(record)}>
          Request Update
        </Button>
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
          Dashboard
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">My Plates</Menu.Item>
          <Menu.Item key="2" icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main Content */}
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openNewModal}
            style={{ marginTop: 16 }}
          >
            Request New Plate
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
          <Card title="My Plates" bordered={false}>
            <Table
              dataSource={plates.map(p => ({
                key: p.id,
                plate: p.plate,
                status: p.status
              }))}
              columns={columns}
              loading={loadingPlates}
            />
          </Card>
        </Content>
      </Layout>

      {/* “Request New Plate” Modal */}
      <Modal
        title="Request a New Plate"
        open={isNewModalOpen}
        onCancel={() => setIsNewModalOpen(false)}
        footer={null}
      >
        <Form form={newForm} layout="vertical" onFinish={submitNewPlate}>
          <Form.Item
            label="Plate Number"
            name="plate"
            rules={[{ required: true, message: 'Enter a plate number' }]}
          >
            <Input placeholder="e.g. GHI789" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Send Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* “Request Update” Modal */}
      <Modal
        title={`Request Update for ${currentRow?.plate}`}
        open={isUpdateModalOpen}
        onCancel={() => setIsUpdateModalOpen(false)}
        footer={null}
      >
        <Form form={updateForm} layout="vertical" onFinish={submitUpdatePlate}>
          <Form.Item label="Plate Number" name="plate">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Desired Status"
            name="newStatus"
            rules={[{ required: true, message: 'Select a status' }]}
          >
            <Select>
              <Select.Option value="Authorized">Authorized</Select.Option>
              <Select.Option value="Denied">Denied</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit Update Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
