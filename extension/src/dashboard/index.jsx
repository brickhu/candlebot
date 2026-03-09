// Dashboard 主入口文件
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import DashboardApp from './DashboardApp'
import './index.css'

// 渲染应用
render(() => (
  <Router>
    <Route path="/" component={DashboardApp} />
    {/* 其他路由将在 DashboardApp 中定义 */}
  </Router>
), document.getElementById('root'))