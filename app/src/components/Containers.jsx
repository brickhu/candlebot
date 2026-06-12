import mergeClasses from "@robit-dev/tailwindcss-class-combiner"
const Container7xl = props => {
  return(
    <div class="@container">
      <div class={mergeClasses("grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-4 @sm:gap-6 px-4 mx-auto max-w-7xl min-w-sm ",props?.class || props?.className)}>
        {props?.children}
      </div>
    </div>
  )
}

const BlockInContainer7xl = props => {
  
  return(
    <div className="col-span-full">{props?.children}</div>
  )
}

export {
  Container7xl,
  BlockInContainer7xl
}