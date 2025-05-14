import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
import { store } from './store';
import SaveDashboard from './components/Save/SaveDashboard';
import PackageSelection from './components/Save/PackageSelection';
import Login from './components/Auth/Login';
import { RootState } from './store';
import { Onboarding } from './components/onboarding/onboarding';
import { Registration } from './components/registration/Registration';
import ForgotPassword from './components/Auth/ForgotPassword';
import Profile from './components/Profile/Profile';
import Home from './components/Home/Home';
import SelfGoalSteps from './components/Goals/SelfGoalSteps';
import FamilyGoalSteps from './components/Goals/FamilyGoalSteps';
import History from './components/History/History';
import GoalDetail from './components/Goals/GoalDetail';
import FAQ from './components/FAQ/FAQ';

import Toolbar from './components/Toolbar/Toolbar';
import Goals from './components/Goals/Goals';
import './styles/base/_reset.css';
import { useAuthInit } from './hooks/useAuthInit';
import Footer from './components/Footer/Footer';
import Contacts from './components/Contacts/Contacts';

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.user);
  
  if (loading) {
    // Можно добавить компонент загрузки
    return <div>Загрузка...</div>;
  }
  
  return isAuthenticated ? element : <Navigate to="/onboarding" replace />;
};

// Layout component with navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <main>{children}</main>
      <Toolbar />
    </>
  );
};

// App Routes component
const AppRoutes: React.FC = () => {
  useAuthInit();
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/registration" element={<Registration />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute element={<Profile />} />
          </Layout>
        }
      />
      <Route
        path="/goals"
        element={
          <Layout>
            <ProtectedRoute element={<Goals />} />
          </Layout>
        }
      />
      <Route
        path="/self-goal-steps"
        element={
          <Layout>
            <ProtectedRoute element={<SelfGoalSteps />} />
          </Layout>
        }
      />
      <Route
        path="/family"
        element={
          <Layout>
            <ProtectedRoute element={<FamilyGoalSteps />} />
          </Layout>
        }
      />
      <Route
        path="/"
        element={
          <Layout>
            <ProtectedRoute element={<Home />} />
          </Layout>
        }
      />
      <Route
        path="/goal/:goalId"
        element={
          <Layout>
            <ProtectedRoute element={<GoalDetail />} />
          </Layout>
        }
      />
      <Route
        path="/packages"
        element={
          <Layout>
            <ProtectedRoute element={<PackageSelection />} />
          </Layout>
        }
      />
      <Route
        path="/history"
        element={
          <Layout>
            <ProtectedRoute element={<History />} />
          </Layout>
        }
      />
      <Route
        path="/faq"
        element={
          <Layout>
            <ProtectedRoute element={<FAQ />} />
          </Layout>
        }
      />
      <Route
        path="/contacts"
        element={
          <Layout>
            <ProtectedRoute element={<Contacts />} />
          </Layout>
        }
      />
    </Routes>
  );
};

// App component wrapped with providers
const AppWrapper = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
        <Footer />
      </Router>
    </Provider>
  );
};

export default AppWrapper;
