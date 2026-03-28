import { useAuth } from "../contexts/auth"
import Avatar from "./Avatar"
import { useNavigate } from "@solidjs/router"
import { t,setDictionarys,locale,setLocale,locales } from "../i18n"
import { Icon } from "@iconify-icon/solid"
import { For } from "solid-js"

export default props => {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleUserLogout = ()=>{
    if(auth?.isLoading()){
      return
    }
    auth?.logout()
    console.log('Logout')
  }
  const handleLogin = () =>{
    navigate("/login")
  }
  return(
    <>
    <div className="navbar bg-base-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl" onClick={()=>console.log(auth?.user())}>Candlebot</a>
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />

        <Show
          when={auth?.user()!=null&&auth?.isLoading()==false}
          fallback={<div>
            <button className="btn btn-primary" disabled={auth?.isLoading()==true} onClick={handleLogin}>Login</button>
          </div>}
        >
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <Avatar username={auth?.user()?.email} className="size-10"/>
              {/* <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" /> */}
            </div>
          </div>
          <ul
            tabIndex="-1"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li><a>Settings</a></li>
            <li onClick={()=>document.getElementById('modal_logout').showModal()}><a>Logout</a></li>
          </ul>

        </div>
        <div className="dropdown dropdown-end">
          <div tabindex="1" role="button" class="btn btn-ghost rounded-full">
            <Icon icon="iconoir:language"></Icon>
            <Icon icon="iconoir:nav-arrow-down" />
          </div>
          <ul
            tabindex="1"
            class="menu dropdown-content panel rounded-box z-2 m-3 w-36 p-2 ">
              <For each={Object.keys(locales)}>
                {(item) => (
                  <li>
                    <a role="button" onClick={()=>setLocale(item)} class="btn btn-ghost w-full justify-start">
                      <span class="inline-flex bg-base-content/80 text-base-100 uppercase rounded-md text-xs px-1">{item}</span>
                      <span>{locales[item].name}</span>
                    </a>
                  </li>
                  )
                }
              </For>
          </ul>
        </div>
        </Show>
      </div>
    </div>
    <dialog id="modal_logout" className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Logout</h3>
        <p className="py-4">Are you sure you want to logout?</p>
        <div className="modal-action">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <div className="flex items-center justify-end gap-1">
              <button className="btn">Cancel</button>
              <button className="btn btn-error" onClick={handleUserLogout}>Confirm</button>
            </div>

          </form>
        </div>
      </div>
    </dialog>
    </>
  )
}