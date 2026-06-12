import { onMount, onCleanup, Show } from "solid-js";

import mergeClasses from "@robit-dev/tailwindcss-class-combiner"

export default props => {
  let _pop


  const openDialog = () => {
    _pop.showModal();
    setTimeout(() => document.activeElement.blur(), 0);
  };

  const closeDialog = () => {
    _pop.close()
  };


  onMount(() => {    
    props.ref({
      open: openDialog,
      close: closeDialog
    })
  });


  return (
    <dialog 
      ref={_pop} 
      className="modal "
      id={props?.id}
      classList={{
        "modal-bottom sm:modal-middle" : !props?.className && !props?.class,
        "" : props?.className || props?.class
      }}
      onCancel={(e)=>{
        if(props?.disclosable){
          e.preventDefault()
        }
      }}
    >
      <div className={mergeClasses("modal-box p-0 border border-white/5",props?.className || props?.class)}>
        <Show when={props?.title}>
          <form method="dialog" className="flex items-center justify-between p-2 min-h-12 sticky bg-base-100 top-0 left-0 ">
            <h2 className="text-lg ml-3 font-bold">{props?.title}</h2>
            <button className="btn btn-circle btn-ghost" onClick={closeDialog} disabled={props?.disclosable}><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" className=" scale-200" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"></path></svg></button>
          </form>
        </Show>
        <div>{props?.children}</div>
        <Show when={props?.action}>
          <div className="modal-action p-4">{props?.action}</div>
        </Show>
      </div>
      <Show when={props?.closable}><label className="modal-backdrop" onClick={closeDialog}>Close</label></Show>
    </dialog>
  );
}
