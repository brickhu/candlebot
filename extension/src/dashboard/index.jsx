// Dashboard 主入口文件
import { render } from 'solid-js/web'
import DashboardApp from './DashboardApp'
import './index.css'

// 渲染应用
render(() => <DashboardApp />, document.getElementById('root'))