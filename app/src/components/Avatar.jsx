
import mergeClasses from "@robit-dev/tailwindcss-class-combiner"
import { generateFromString } from "generate-avatar"


const data_uri = (v) => 'data:image/svg+xml;utf8,' + generateFromString(v||"777")

export default (props) => {
  return (
    <img src={data_uri(props?.username || "777")} alt={props?.username} class={mergeClasses(`size-8 rounded-full shadow-md border border-base-300`, `${props?.class || props?.className}`)}/>
  )
}