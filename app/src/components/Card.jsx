import { useNavigate } from "@solidjs/router"
export default props => {
  const meta = props?.analysis_metadata
  const navigate = useNavigate()
  const handleDetail = () =>{

  }
  return(
    <div className='col-span-full md:col-span-3 lg:col-span-4 bg-base-200 rounded-2xl aspect-video hover:bg-amber-100' onClick={()=>{
      navigate(`/analysis/${props.id}`, { state: { id: props?.id } })
    }}>
      <div>{meta?.pair+"-"+meta?.timeframe} / {meta?.price}</div>
      <div>{meta?.rating} : {meta?.summary}</div>
    </div>
  )
}