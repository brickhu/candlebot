// import Header from "../components/Header";
// import { Container7xl } from "../components/Containers";
// import { createSignal, onMount } from "solid-js";
// import { useNavigate } from "@solidjs/router";

// export default props => {
//   const navigate = useNavigate()
//   const [imageData,setImageData] = createSignal(null)
//   onMount(()=>{
//     console.log("CANDLE_DATA_READY")
//   // 在你的 /new 页面组件中
//     window.addEventListener("CANDLE_DATA_READY", (e) => {
//       const { image, timestamp } = e.detail;
//       console.log("网页已接收到截图:", timestamp);
      
//       // 假设你有一个 setPreview 状态
//       // setPreview(image); 
//     });
//   })
//   const handleCancel = ()=>{
//     console.log("取消")
//     navigate(-1)
//   }
//   return(
//     <div class="animate-fade-in">
//     <Container7xl>
//       <div className="col-span-full flex items-center justify-center">
//         <div className="max-w-3xl ">
//           <img src={imageData()} className="w-full"/>
//         </div>
//         <div className="max-w-3xl flex gap-4 items-center">
//           <button className="btn" onClick={handleCancel}>Cancel</button>
//           <button className="btn btn-primary">Comfirm</button>
//         </div>
//       </div>
//     </Container7xl>
//   </div>
//   )
// }


// 你的 localhost:5137/new 页面代码 (SolidJS 示例)// localhost:5137/new 页面组件
import { onMount, createSignal } from 'solid-js';
import { useAuth } from '../contexts/auth';
import { useNavigate } from "@solidjs/router";
import { api } from '../lib/api';

export default function NewPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [screenshot, setScreenshot] = createSignal(null);
  const [isExtensionLoading, setIsExtensionLoading] = createSignal(false);
  const [isSubmitting,setIsSubmitting] = createSignal(false)
  const [error,setError] = createSignal(null)
  const [platform,setPlatform] = createSignal("aggr")
  const [language,setLanguage] = createSignal("zh")

  onMount(() => {
    // 1. 检查是否是通过扩展进入
    const params = new URLSearchParams(window.location.search);
    const fromExt = params.get('source') === 'extension';
    
    if (fromExt) {
      setIsExtensionLoading(true);

      // 2. 挂载插件专用监听器
      window.addEventListener("CANDLE_DATA_READY", (e) => {
        setScreenshot(e.detail.image);
        setIsExtensionLoading(false);
        // 可选：数据拿到后清理 URL 标识，让页面看起来干净些
        window.history.replaceState({}, '', window.location.pathname);
      });

      // 3. 发送握手信号
      setTimeout(() => {
        window.postMessage({ type: "CANDLE_PAGE_READY" }, "*");
      }, 100);
      return
    }

    const uploaded = sessionStorage.getItem('dashboard_selected_image')

    if(uploaded){
      setScreenshot(uploaded);
    }
  });

  // const handleSubmit = async() =>{
  //   const isAuthenticated = await auth?.isAuthenticated()
  //   if(isAuthenticated){
  //     console.log("提交报道")
  //   }else{
  //     navigate("/login")
  //   }
  // }

    const handleSubmit = async () => {
      if (!screenshot()) {
        setError('请选择要分析的图片')
        return
      }
  
      // 简单直接地检查用户是否已登录：检查是否有认证token
      const hasAuthToken = auth?.isAuthenticated
  
      console.log('🔍 提交前检查登录状态:', {
        hasAuthToken,
        localStorageToken: localStorage.getItem('auth_token'),
        authUser: auth.user ? auth.user() : null
      })
  
      if (!hasAuthToken) {
        console.log('⚠️ 用户未登录，显示登录提示')
        navigate("/login")
        return
      }
  
      setIsSubmitting(true)
      setError(null)

      console.log("screenshot:",screenshot())
  
      try {
      //   // 读取图片为base64
      //   const reader = new FileReader()
      //   const base64Promise = new Promise((resolve, reject) => {
      //     reader.onload = (e) => {
      //       // 移除data:image/png;base64,前缀
      //       const base64 = e.target.result.split(',')[1]
      //       resolve(base64)
      //     }
      //     reader.onerror = reject
      //   })
      //   reader.readAsDataURL(selectedImage())
  
      //   const imageBase64 = await base64Promise
      //   console.log('📸 提交图片分析，大小:', imageBase64.length, '字符')
  
        const response = await api.analyzeImage(screenshot(), platform(), language())
        console.log('📡 分析响应:', response)
  
        if (response.success && response.data) {
          console.log('✅ 分析成功，记录ID:', response.data.record_id)
  
          // 关闭弹窗
          // onClose()
  
          // 跳转到分析结果页面
          if (response.data.record_id) {
            onSuccess(response.data.record_id)
          } else {
            // 如果没有record_id，跳转到仪表板
            onSuccess(null)
          }
        } else {
          console.error('❌ 分析失败:', response.error)
          setError(response.error?.message || '分析失败，请重试')
        }
      } catch (error) {
        console.error('❌ 提交分析时发生错误:', error)
        setError('提交分析时发生错误，请重试')
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <div class="p-8 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">提交新案例</h1>
      
      {isExtensionLoading() && (
        <div class="p-4 bg-blue-50 text-blue-600 rounded-lg animate-pulse mb-4">
          正在从插件提取截图数据...
        </div>
      )}

      <div class="border-2 border-dashed border-slate-200 rounded-2xl p-4 min-h-[300px] flex items-center justify-center bg-slate-50">
        {screenshot() ? (
          <div class="relative group">
             <img src={screenshot()} class="rounded-lg shadow-2xl max-w-full h-auto" />
             {/* <button 
               onClick={() => setScreenshot(null)} 
               class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
             >
               ×
             </button> */}
          </div>
        ) : (
          <div class="text-center">
            <p class="text-slate-400 mb-2">点击此处手动上传图片</p>
            <p class="text-[10px] text-slate-300 uppercase">或通过 CandleSnap 插件直接截图跳转</p>
          </div>
        )}
      </div>

      <div className='flex items-center gap-8'>
        <button className='btn-accent' onClick={navigate(-1)} disabled={isSubmitting()}>Cancel</button>
        <button className='btn btn-primary' onClick={handleSubmit} disabled={isSubmitting()}>{isSubmitting()?"Submiting":"Submit"}</button>
      </div>
    </div>
  );
}