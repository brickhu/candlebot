import { Show, createSignal, onMount, createResource } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { useAuth } from '../contexts/auth'
import { api } from '../lib/api'

export default props => {
  const auth = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const [isLoading, setIsLoading] = createSignal(true)
  const [result,{}] = createResource(()=>params?.id,async(id)=>{
    if(!id && typeof(id) != "number") return
    const response = await api.getAnalysis(id)
    console.log('response: ', response);
  })

  onMount(async()=>{
        // 检查认证
    if(!auth?.isAuthenticated){
      navigate('/login', { state: { from: `/analysis/${params.id}` } })
      return
    }
    // if (!auth?.user?.()) {
    //   console.log('❌ 用户未认证，重定向到登录页')
    //   navigate('/login', { state: { from: `/analysis/${params.id}` } })
    //   return
    // }
    console.log('分析ID:', params.id)
  })
  return(
    <div>{params.id}</div>
  )
}

// const AnalysisResultPage = () => {
//   const auth = useAuth()
//   const navigate = useNavigate()
//   const params = useParams()
//   const [analysis, setAnalysis] = createSignal(null)
//   const [isLoading, setIsLoading] = createSignal(true)
//   const [error, setError] = createSignal(null)
//   const [authInitialized, setAuthInitialized] = createSignal(false)

//   onMount(() => {
//     console.log('=== AnalysisResult mounted ===')
//     console.log('分析ID:', params.id)

    // // 检查认证
    // if (!auth?.user?.()) {
    //   console.log('❌ 用户未认证，重定向到登录页')
    //   navigate('/login', { state: { from: `/analysis/${params.id}` } })
    //   return
    // }

//     setAuthInitialized(true)
//     loadAnalysis()
//   })

//   const loadAnalysis = async () => {
//     setIsLoading(true)
//     setError(null)
//     try {
//       console.log('📡 加载分析结果...')
//       const response = await api.getAnalysis(params.id)
//       console.log('📡 分析结果响应:', response)

//       if (response.success && response.data) {
//         console.log('✅ 成功加载分析结果:', response.data)
//         setAnalysis(response.data)
//       } else {
//         console.error('❌ 加载分析结果失败:', response.error)
//         setError(response.error?.message || '加载分析结果失败')
//       }
//     } catch (error) {
//       console.error('❌ 加载分析结果时发生错误:', error)
//       setError('加载分析结果时发生错误')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleBackToDashboard = () => {
//     navigate('/dashboard')
//   }

//   const handleNewAnalysis = () => {
//     navigate('/dashboard')
//   }

//   const formatDate = (dateString) => {
//     const date = new Date(dateString)
//     return date.toLocaleDateString('zh-CN', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   const getRatingColor = (score) => {
//     if (score >= 2) return 'text-green-400'
//     if (score >= 1) return 'text-yellow-400'
//     if (score >= -1) return 'text-gray-400'
//     if (score >= -2) return 'text-orange-400'
//     return 'text-red-400'
//   }

//   const getRatingEmoji = (score) => {
//     if (score >= 2) return '🟢🟢🟢'
//     if (score >= 1) return '🟢🟢⚫'
//     if (score >= -1) return '⚫⚫⚫'
//     if (score >= -2) return '🔴🔴⚫'
//     return '🔴🔴🔴'
//   }

//   return (
//     <div class="animate-fade-in min-h-screen bg-bg">
//       <Show when={!authInitialized()}>
//         <div class="text-center py-20">
//           <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p class="text-muted">检查认证状态...</p>
//         </div>
//       </Show>

//       <Show when={authInitialized()}>
//         {/* Header */}
//         <div class="border-b border-border bg-surface">
//           <div class="max-w-6xl mx-auto px-6 py-6">
//             <div class="flex items-center justify-between">
//               <div class="flex items-center gap-4">
//                 <button
//                   onClick={handleBackToDashboard}
//                   class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors flex items-center gap-2"
//                 >
//                   ← 返回仪表板
//                 </button>
//                 <div>
//                   <h1 class="text-2xl font-bold">分析结果</h1>
//                   <p class="text-sm text-muted">
//                     {analysis() ? formatDate(analysis().created_at) : '加载中...'}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={handleNewAnalysis}
//                 class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
//               >
//                 新建分析
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div class="max-w-6xl mx-auto px-6 py-8">
//           <Show when={isLoading()}>
//             <div class="text-center py-20">
//               <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//               <p class="text-muted">加载分析结果...</p>
//             </div>
//           </Show>

//           <Show when={error()}>
//             <div class="text-center py-20">
//               <div class="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span class="text-2xl">⚠️</span>
//               </div>
//               <h3 class="text-xl font-bold mb-2">加载失败</h3>
//               <p class="text-muted mb-6">{error()}</p>
//               <div class="flex gap-3 justify-center">
//                 <button
//                   onClick={loadAnalysis}
//                   class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
//                 >
//                   重试
//                 </button>
//                 <button
//                   onClick={handleBackToDashboard}
//                   class="px-6 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors"
//                 >
//                   返回仪表板
//                 </button>
//               </div>
//             </div>
//           </Show>

//           <Show when={analysis()}>
//             <div class="grid lg:grid-cols-3 gap-8">
//               {/* Left Column - Summary */}
//               <div class="lg:col-span-1 space-y-6">
//                 {/* Rating Card */}
//                 <div class="bg-surface border border-border rounded-xl p-6">
//                   <div class="flex items-center justify-between mb-4">
//                     <h3 class="font-bold">评级</h3>
//                     <span class={`text-2xl ${getRatingColor(analysis().analysis_metadata?.rating_score || 0)}`}>
//                       {getRatingEmoji(analysis().analysis_metadata?.rating_score || 0)}
//                     </span>
//                   </div>
//                   <div class="text-sm text-muted">
//                     {analysis().analysis_metadata?.rating || '无评级信息'}
//                   </div>
//                 </div>

//                 {/* Metadata Card */}
//                 <div class="bg-surface border border-border rounded-xl p-6">
//                   <h3 class="font-bold mb-4">基本信息</h3>
//                   <div class="space-y-3">
//                     <div>
//                       <div class="text-xs text-muted mb-1">交易对</div>
//                       <div class="font-medium">{analysis().analysis_metadata?.pair || '未知'}</div>
//                     </div>
//                     <div>
//                       <div class="text-xs text-muted mb-1">时间周期</div>
//                       <div class="font-medium">{analysis().analysis_metadata?.timeframe || '未知'}</div>
//                     </div>
//                     <div>
//                       <div class="text-xs text-muted mb-1">当前价格</div>
//                       <div class="font-medium">${analysis().analysis_metadata?.price || '0'}</div>
//                     </div>
//                     <div>
//                       <div class="text-xs text-muted mb-1">分析平台</div>
//                       <div class="font-medium">{analysis().platform}</div>
//                     </div>
//                     <div>
//                       <div class="text-xs text-muted mb-1">分析ID</div>
//                       <div class="font-mono text-sm">{analysis().id}</div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Actions Card */}
//                 <div class="bg-surface border border-border rounded-xl p-6">
//                   <h3 class="font-bold mb-4">操作</h3>
//                   <div class="space-y-3">
//                     <button class="w-full px-4 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors text-left">
//                       📋 复制报告
//                     </button>
//                     <button class="w-full px-4 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors text-left">
//                       📤 导出为图片
//                     </button>
//                     <button class="w-full px-4 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors text-left">
//                       💬 提问分析
//                     </button>
//                     <button class="w-full px-4 py-3 bg-surface border border-red-400 text-red-400 rounded-lg font-medium hover:bg-red-50 transition-colors text-left">
//                       🗑️ 删除分析
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Right Column - Report */}
//               <div class="lg:col-span-2">
//                 <div class="bg-surface border border-border rounded-xl p-6">
//                   <div class="flex items-center justify-between mb-6">
//                     <h2 class="text-xl font-bold">分析报告</h2>
//                     <div class="flex items-center gap-2">
//                       <span class="px-3 py-1 bg-bg border border-border rounded-full text-xs">
//                         {analysis().platform}
//                       </span>
//                       <span class="text-sm text-muted">
//                         {formatDate(analysis().created_at)}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Report Content */}
//                   <div class="prose prose-invert max-w-none">
//                     <div class="whitespace-pre-wrap font-mono text-sm leading-relaxed">
//                       {analysis().report_data?.report || '无报告内容'}
//                     </div>
//                   </div>

//                   {/* Summary */}
//                   <Show when={analysis().analysis_metadata?.summary}>
//                     <div class="mt-8 pt-6 border-t border-border">
//                       <h3 class="font-bold mb-3">总结</h3>
//                       <p class="text-muted">{analysis().analysis_metadata.summary}</p>
//                     </div>
//                   </Show>
//                 </div>

//                 {/* Image Preview (if available) */}
//                 <Show when={analysis().image_data}>
//                   <div class="mt-6 bg-surface border border-border rounded-xl p-6">
//                     <h3 class="font-bold mb-4">原始图表</h3>
//                     <div class="flex justify-center">
//                       <img
//                         src={`data:image/png;base64,${analysis().image_data}`}
//                         alt="分析图表"
//                         class="max-w-full rounded-lg border border-border"
//                       />
//                     </div>
//                   </div>
//                 </Show>
//               </div>
//             </div>
//           </Show>
//         </div>
//       </Show>
//     </div>
//   )
// }

// export default AnalysisResultPage