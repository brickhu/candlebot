/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { Router, Route } from "@solidjs/router";
import { AuthProvider } from './lib/auth'
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';
import UserTestPage from './pages/UserTest';
import TestProxyPage from './pages/TestProxy';
import NotFound from './pages/NotFound';

const root = document.getElementById('root')

function App() {
  return (
    <Router>
      <AuthProvider>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/oauth/callback" component={OAuthCallback} />
        <Route path="/user-test" component={UserTestPage} />
        <Route path="/test-proxy" component={TestProxyPage} />
        <Route path="*" component={NotFound} />
      </AuthProvider>
    </Router>
  )
}

render(() => <App />, root)
