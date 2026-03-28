/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { Router, Route } from "@solidjs/router";
import { AuthProvider } from './contexts/auth'
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisResult from './pages/AnalysisResult';
import OAuthCallback from './pages/OAuthCallback';
import UserTestPage from './pages/UserTest';
import TestProxyPage from './pages/TestProxy';
import TestUploadPage from './pages/TestUpload';
import TestRedirectPage from './pages/TestRedirect';
import NotFound from './pages/NotFound';
import New from './pages/New';

const root = document.getElementById('root')

function App() {
  return (

    <AuthProvider>
      <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/oauth/callback" component={OAuthCallback} />
        <Route path="/new" component={New} />
        <Route path="/analysis/:id" component={AnalysisResult} />
        {/* <Route path="/dashboard" component={Dashboard} />
        <Route path="/new" component={NewAnalysis} />
        <Route path="/analysis/:id" component={AnalysisResult} />
        
        <Route path="/user-test" component={UserTestPage} />
        <Route path="/test-proxy" component={TestProxyPage} />
        <Route path="/test-upload" component={TestUploadPage} />
        <Route path="/test-redirect" component={TestRedirectPage} /> */}
        <Route path="*" component={NotFound} />
      </Router>
    </AuthProvider>

  )
}

render(() => <App />, root)
