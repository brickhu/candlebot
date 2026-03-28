import { Show, createEffect, createSignal, onMount, createResource } from 'solid-js'

import { useNavigate } from '@solidjs/router'
import { useAuth } from '../contexts/auth'
import { api } from '../lib/api'
import { handleAutoAnalysis, setupExtensionReceiver } from '../lib/extension'
import Header from '../components/Header'
import { Container7xl,BlockInContainer7xl } from "../components/Containers"
import {t} from "../i18n/index"
import Card from '../components/Card'

const DashboardPage = () => {
  let fileInputRef
  const auth = useAuth()
  const navigate = useNavigate()
  // const [analyses, setAnalyses] = createSignal([])
  const [analyses,{refetch}] = createResource(async()=>{
    const response = await api.getAnalyses()
    console.log('analyses response: ', response);
    if(response.success && response.data){
      console.log('analyses response: ', response.data);
      return response.data?.items
    }else{
      throw response.error
    }
  })
  const [isLoading, setIsLoading] = createSignal(true)
  const [authInitialized, setAuthInitialized] = createSignal(false)


  createEffect(async()=>{
    if(auth?.isLoading()===false){
      console.log("ccccccc")
      const user = await auth?.user()
      console.log('user: ', user);
      if(user === null){

        navigate("/login")
        setAuthInitialized(false)
        setIsLoading(false)
      }else{
        setAuthInitialized(true)
        setIsLoading(false)
      }
    }
  }) 

  createEffect(()=>console.log("飞飞",analyses()))
  

  // const loadAnalyses = async () => {
  //   setIsLoading(true)
  //   try {
  //     console.log('📡 加载分析数据...')
  //     const response = await api.getAnalyses()
  //     console.log('📡 分析数据响应:', response)

  //     if (response.success && response.data) {
  //       console.log('✅ 成功加载分析数据:', response.data)
  //       // 确保数据是数组
  //       const data = Array.isArray(response.data) ? response.data : []
  //       setAnalyses(data)
  //     } else {
  //       console.error('❌ 加载分析数据失败:', response.error)
  //       setAnalyses([]) // 设置为空数组而不是undefined
  //     }
  //   } catch (error) {
  //     console.error('❌ 加载分析数据时发生错误:', error)
  //     setAnalyses([]) // 设置为空数组而不是undefined
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  const handleNewAnalysis = () => {
    console.log('📸 用户点击新建分析，弹出文件选择框')

    // 创建隐藏的文件输入元素
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'

    // 添加change事件监听器
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0]
      if (!file) return

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件（PNG、JPG、JPEG）')
        return
      }

      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }

      console.log('✅ 文件选择成功:', file.name, '大小:', file.size, '类型:', file.type)

      // 创建FileReader读取文件为base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target.result
        console.log('📸 文件读取成功，base64长度:', base64Data.length)

        // 保存文件数据到sessionStorage，以便在/new页面使用
        sessionStorage.setItem('dashboard_selected_image', base64Data)
        sessionStorage.setItem('dashboard_selected_file_name', file.name)
        sessionStorage.setItem('dashboard_selected_file_type', file.type)
        sessionStorage.setItem('dashboard_selected_file_size', file.size.toString())

        // 跳转到/new页面
        console.log('🚀 跳转到/new页面')
        navigate('/new')
      }

      reader.onerror = (error) => {
        console.error('❌ 读取文件失败:', error)
        alert('读取文件失败，请重试')
      }

      reader.readAsDataURL(file)
    })

    // 触发文件选择
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)
  }


  const handleLogout = async () => {
    // 确认对话框
    if (!confirm('Are you sure you want to logout?')) {
      return
    }

    try {
      console.log('🚪 用户请求退出登录')
      if (auth?.logout) {
        await auth.logout()
        console.log('✅ 退出登录成功')
        // 重定向到首页
        navigate('/')
      } else {
        console.error('❌ auth.logout 方法不存在')
        alert('Logout failed: authentication service not available')
      }
    } catch (error) {
      console.error('❌ 退出登录失败:', error)
      alert('Logout failed. Please try again.')
    }
  }

  const handleViewAnalysis = (id) => {
    console.log('🔍 查看分析详情:', id)
    navigate(`/analysis/${id}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRatingColor = (score) => {
    if (score >= 2) return 'text-green-400'
    if (score >= 1) return 'text-yellow-400'
    if (score >= -1) return 'text-gray-400'
    if (score >= -2) return 'text-orange-400'
    return 'text-red-400'
  }

  const getRatingEmoji = (score) => {
    if (score >= 2) return '🟢🟢🟢'
    if (score >= 1) return '🟢🟢⚫'
    if (score >= -1) return '⚫⚫⚫'
    if (score >= -2) return '🔴🔴⚫'
    return '🔴🔴🔴'
  }

  const handleFiles = (e)=>{
    console.log(e.target)
    const selected = Array.from(e.target.files);

    // console.log('selected: ', selected);
    // // const file = selected?.[0]
    // // // 创建预览
    // // const reader = new FileReader()
    // // reader.onload = (e) => {
    // //   setImagePreview(e.target.result)
    // // }
    // // reader.readAsDataURL(file)
  }

  return (
    <>
      <Header/>
      <div class="animate-fade-in">
        <Container7xl>
          <div className="col-span-full md:col-span-3">
            <h1 className="text-3xl font-bold mb-6">{t("common.hello")}</h1>

            {/* 原始内容 */}
            <div className="mt-8">
              <p className="text-lg mb-4">Dashboard content:</p>
              
            </div>
          </div>
          <div className='col-span-full md:col-span-3'>
            <div className="flex gap-4 items-center">
                {/* <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleFiles}
                /> */}
                <button 
                  className='btn btn-primary' onClick={handleNewAnalysis}>
                  Upload Screenshot
                </button>
                <span>or</span>
                <button className='btn btn-secondary' onClick={() => navigate('/login')}>
                  Install Extension
                </button>
              </div>
          </div>
        </Container7xl>
        <Container7xl class="py-8">
          <Suspense fallback="loading...">
            <For each={analyses()}>
              {(item) => <Card {...item}/>}
            </For>
          </Suspense>
        </Container7xl>
      </div>
    </>
  )

  // return (
  //   <div class="animate-fade-in">
  //     <Show when={!authInitialized()}>
  //       <div class="text-center py-20">
  //         <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  //         <p class="text-muted">Initializing authentication...</p>
  //       </div>
  //     </Show>

  //     <Show when={authInitialized() && (!auth?.user?.())}>
  //       <div class="text-center py-20">
  //         <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  //         <p class="text-muted">Loading dashboard...</p>
  //       </div>
  //     </Show>

  //     <Show when={authInitialized() && auth?.user?.()}>
  //       {/* Dashboard Header */}
  //       <div class="border-b border-border">
  //         <div class="max-w-6xl mx-auto px-6 py-8">
  //           <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
  //             <div>
  //               <h1 class="text-3xl font-bold mb-2">Welcome back, {auth?.user()?.username}!</h1>
  //               <p class="text-muted">
  //                 You have {Math.max(0, (Number(auth?.user()?.quota_total) || 0) - (Number(auth?.user()?.quota_used) || 0))} free analyses remaining today
  //               </p>
  //             </div>
  //             <div class="flex flex-col sm:flex-row gap-3">
  //               <button
  //                 onClick={handleNewAnalysis}
  //                 class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
  //               >
  //                 New Analysis
  //               </button>
  //               <button
  //                 onClick={() => handleLogout()}
  //                 class="px-6 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors"
  //               >
  //                 Logout
  //               </button>
  //             </div>
  //           </div>

  //           {/* Stats */}
  //           <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
  //             {[
  //               {
  //                 label: 'Total Analyses',
  //                 value: (analyses()?.length || 0).toString(),
  //                 change: '+12%',
  //               },
  //               {
  //                 label: 'Today Used',
  //                 value: auth?.user()?.quota_used?.toString() || '0',
  //                 change: `${Number(auth?.user()?.quota_used) || 0}/${Number(auth?.user()?.quota_total) || 0}`,
  //               },
  //               {
  //                 label: 'Avg. Rating',
  //                 value: '2.1',
  //                 change: '+0.3',
  //               },
  //               {
  //                 label: 'Accuracy',
  //                 value: '87%',
  //                 change: '+5%',
  //               },
  //             ].map((stat) => (
  //               <div class="bg-surface border border-border rounded-xl p-4">
  //                 <div class="text-sm text-muted mb-1">{stat.label}</div>
  //                 <div class="flex items-baseline gap-2">
  //                   <div class="text-2xl font-bold">{stat.value}</div>
  //                   <div class="text-xs text-green-400">{stat.change}</div>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       </div>

  //       {/* Recent Analyses */}
  //       <div class="max-w-6xl mx-auto px-6 py-8">
  //         <div class="flex items-center justify-between mb-6">
  //           <h2 class="text-2xl font-bold">Recent Analyses</h2>
  //           <button
  //             onClick={loadAnalyses}
  //             class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
  //           >
  //             Refresh
  //           </button>
  //         </div>

  //         <Show
  //           when={!isLoading()}
  //           fallback={
  //             <div class="text-center py-12">
  //               <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
  //               <p class="text-muted">Loading analyses...</p>
  //             </div>
  //           }
  //         >
  //           <Show
  //             when={analyses() && analyses().length > 0}
  //             fallback={
  //               <div class="text-center py-12 border-2 border-dashed border-border rounded-2xl">
  //                 <div class="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4">
  //                   <span class="text-2xl">📊</span>
  //                 </div>
  //                 <h3 class="text-xl font-bold mb-2">No analyses yet</h3>
  //                 <p class="text-muted mb-6">Start by analyzing your first chart!</p>
  //                 <button
  //                   onClick={handleNewAnalysis}
  //                   class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
  //                 >
  //                   Analyze First Chart
  //                 </button>
  //               </div>
  //             }
  //           >
  //             <div class="grid gap-4">
  //               {analyses()?.map((analysis) => (
  //                 <div class="bg-surface border border-border rounded-xl p-6 hover:border-primary transition-colors">
  //                   <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
  //                     <div>
  //                       <div class="flex items-center gap-3 mb-2">
  //                         <span class={`text-2xl ${getRatingColor(analysis.analysis_metadata?.rating_score || 0)}`}>
  //                           {getRatingEmoji(analysis.analysis_metadata?.rating_score || 0)}
  //                         </span>
  //                         <div>
  //                           <div class="font-bold">
  //                             {analysis.analysis_metadata?.pair || 'Unknown'} · {analysis.analysis_metadata?.timeframe || 'Unknown'}
  //                           </div>
  //                           <div class="text-sm text-muted">
  //                             ${analysis.analysis_metadata?.price || '0'} · {formatDate(analysis.created_at)}
  //                           </div>
  //                         </div>
  //                       </div>
  //                       <p class="text-sm text-muted line-clamp-2">
  //                         {analysis.analysis_metadata?.summary || 'No summary available'}
  //                       </p>
  //                     </div>
  //                     <div class="flex items-center gap-3">
  //                       <span class="px-3 py-1 bg-bg border border-border rounded-full text-xs">
  //                         {analysis.platform}
  //                       </span>
  //                       <button
  //                         onClick={() => handleViewAnalysis(analysis.id)}
  //                         class="px-4 py-2 text-sm text-primary hover:text-primary-dark transition-colors"
  //                       >
  //                         View Details →
  //                       </button>
  //                     </div>
  //                   </div>
  //                   <div class="border-t border-border pt-4">
  //                     <div class="flex items-center justify-between text-sm">
  //                       <span class="text-muted">Analysis ID: {analysis.id.slice(0, 8)}...</span>
  //                       <div class="flex items-center gap-4">
  //                         <button class="text-muted hover:text-primary">Share</button>
  //                         <button class="text-muted hover:text-primary">Export</button>
  //                         <button class="text-muted hover:text-primary">Delete</button>
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>

  //             {/* Pagination */}
  //             <div class="flex items-center justify-between mt-8 pt-8 border-t border-border">
  //               <button class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors disabled:opacity-50">
  //                 ← Previous
  //               </button>
  //               <div class="text-sm text-muted">Page 1 of 1</div>
  //               <button class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors disabled:opacity-50">
  //                 Next →
  //               </button>
  //             </div>
  //           </Show>
  //         </Show>
  //       </div>

  //       {/* Quick Actions */}
  //       <div class="max-w-6xl mx-auto px-6 py-8">
  //         <h2 class="text-2xl font-bold mb-6">Quick Actions</h2>
  //         <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
  //           {[
  //             {
  //               icon: '📸',
  //               title: 'Capture Chart',
  //               description: 'Take a screenshot from aggr.trade or TradingView',
  //               action: handleNewAnalysis,
  //             },
  //             {
  //               icon: '📊',
  //               title: 'View History',
  //               description: 'Browse all your previous analyses',
  //               action: () => {/* TODO */},
  //             },
  //             {
  //               icon: '⚙️',
  //               title: 'Settings',
  //               description: 'Configure your preferences and account',
  //               action: () => {/* TODO */},
  //             },
  //             {
  //               icon: '🚪',
  //               title: 'Logout',
  //               description: 'Sign out of your account',
  //               action: handleLogout,
  //             },
  //           ].map((action) => (
  //             <button
  //               onClick={action.action}
  //               class="bg-surface border border-border rounded-xl p-6 text-left hover:border-primary transition-colors"
  //             >
  //               <div class="text-3xl mb-4">{action.icon}</div>
  //               <h3 class="font-bold mb-2">{action.title}</h3>
  //               <p class="text-sm text-muted">{action.description}</p>
  //             </button>
  //           ))}
  //         </div>
  //       </div>
  //     </Show>
  //   </div>
  // )
}

export default DashboardPage