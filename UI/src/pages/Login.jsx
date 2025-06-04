import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// Login.jsx
const onFinish = async (values) => {
  setLoading(true);
  try {
    // 1. Call your real backend:
    //    const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(values) });
    //    const { userId, role, token } = await res.json();
    //
    // For now, we’ll mock:
    const mockUserId = values.username === 'admin' ? 1 : 17;
    const mockRole = values.username === 'admin' ? 'admin' : 'user';

    sessionStorage.setItem('loggedIn', 'true');
    sessionStorage.setItem('role', mockRole);
    sessionStorage.setItem('userId', mockUserId);

    message.success('Login successful');
    navigate(mockRole === 'admin' ? '/admin' : '/dashboard');
  } catch (err) {
    message.error('Login failed');
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card title="User Login" style={{ width: 300 }}>
        <Form name="login_form" onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
