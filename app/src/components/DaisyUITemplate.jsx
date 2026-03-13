import { createSignal } from 'solid-js'

const DaisyUITemplate = () => {
  const [count, setCount] = createSignal(0)
  const [theme, setTheme] = createSignal('dark')
  const [isDrawerOpen, setIsDrawerOpen] = createSignal(false)

  const themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
    'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween',
    'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy',
    'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn',
    'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'
  ]

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen())
  }

  return (
    <div data-theme={theme()} class="min-h-screen bg-base-100 text-base-content">
      {/* Drawer */}
      <div class="drawer">
        <input
          id="my-drawer"
          type="checkbox"
          class="drawer-toggle"
          checked={isDrawerOpen()}
          onChange={toggleDrawer}
        />
        <div class="drawer-content">
          {/* Navbar */}
          <div class="navbar bg-base-200 shadow-lg">
            <div class="flex-none">
              <button class="btn btn-square btn-ghost" onClick={toggleDrawer}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
            <div class="flex-1">
              <a class="btn btn-ghost text-xl">DaisyUI Template</a>
            </div>
            <div class="flex-none">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost">
                  Theme
                  <svg width="12px" height="12px" class="inline-block h-2 w-2 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
                    <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                  </svg>
                </div>
                <ul tabindex="0" class="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl max-h-96 overflow-y-auto">
                  {themes.map(t => (
                    <li key={t}>
                      <input
                        type="radio"
                        name="theme-dropdown"
                        class="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                        aria-label={t.charAt(0).toUpperCase() + t.slice(1)}
                        value={t}
                        checked={theme() === t}
                        onChange={() => setTheme(t)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main class="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div class="hero bg-base-200 rounded-2xl p-8 mb-8">
              <div class="hero-content text-center">
                <div class="max-w-md">
                  <h1 class="text-5xl font-bold">Hello there</h1>
                  <p class="py-6">
                    This is a DaisyUI template with SolidJS. DaisyUI adds beautiful,
                    accessible, and customizable components to your Tailwind CSS project.
                  </p>
                  <button class="btn btn-primary">Get Started</button>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Card 1 */}
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title">Buttons</h2>
                  <p>DaisyUI provides beautiful, accessible buttons with various styles.</p>
                  <div class="card-actions justify-end mt-4">
                    <button class="btn btn-primary">Primary</button>
                    <button class="btn btn-secondary">Secondary</button>
                    <button class="btn btn-accent">Accent</button>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title">Alerts</h2>
                  <p>Show important messages to your users with styled alerts.</p>
                  <div class="space-y-2 mt-4">
                    <div class="alert alert-info">
                      <span>This is an info alert!</span>
                    </div>
                    <div class="alert alert-success">
                      <span>This is a success alert!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title">Counter</h2>
                  <p>Interactive component example with SolidJS signals.</p>
                  <div class="flex items-center justify-center space-x-4 mt-4">
                    <button
                      class="btn btn-circle btn-outline"
                      onClick={() => setCount(count() - 1)}
                    >
                      -
                    </button>
                    <span class="text-3xl font-bold">{count()}</span>
                    <button
                      class="btn btn-circle btn-outline"
                      onClick={() => setCount(count() + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div class="card-actions justify-end mt-4">
                    <button
                      class="btn btn-outline btn-error"
                      onClick={() => setCount(0)}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Example */}
            <div class="card bg-base-100 shadow-xl mb-8">
              <div class="card-body">
                <h2 class="card-title">Form Example</h2>
                <form class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Your Name</span>
                    </label>
                    <input type="text" placeholder="Type here" class="input input-bordered w-full" />
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Your Email</span>
                    </label>
                    <input type="email" placeholder="email@example.com" class="input input-bordered w-full" />
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Message</span>
                    </label>
                    <textarea class="textarea textarea-bordered h-24" placeholder="Your message..."></textarea>
                  </div>
                  <div class="form-control">
                    <label class="label cursor-pointer">
                      <span class="label-text">Subscribe to newsletter</span>
                      <input type="checkbox" class="toggle toggle-primary" />
                    </label>
                  </div>
                  <div class="card-actions justify-end">
                    <button type="button" class="btn btn-ghost">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit</button>
                  </div>
                </form>
              </div>
            </div>

            {/* Stats */}
            <div class="stats shadow bg-base-200 mb-8">
              <div class="stat">
                <div class="stat-figure text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="stat-title">Total Components</div>
                <div class="stat-value">45+</div>
                <div class="stat-desc">Ready to use</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                  </svg>
                </div>
                <div class="stat-title">Themes</div>
                <div class="stat-value">{themes.length}</div>
                <div class="stat-desc">Customizable</div>
              </div>
              <div class="stat">
                <div class="stat-figure text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                  </svg>
                </div>
                <div class="stat-title">Accessibility</div>
                <div class="stat-value">100%</div>
                <div class="stat-desc">WCAG compliant</div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer class="footer bg-base-300 text-base-content p-10">
            <aside>
              <svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" class="fill-current">
                <path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"></path>
              </svg>
              <p>DaisyUI Template<br />Built with SolidJS and Tailwind CSS</p>
            </aside>
            <nav>
              <h6 class="footer-title">Services</h6>
              <a class="link link-hover">Branding</a>
              <a class="link link-hover">Design</a>
              <a class="link link-hover">Marketing</a>
              <a class="link link-hover">Advertisement</a>
            </nav>
            <nav>
              <h6 class="footer-title">Company</h6>
              <a class="link link-hover">About us</a>
              <a class="link link-hover">Contact</a>
              <a class="link link-hover">Jobs</a>
              <a class="link link-hover">Press kit</a>
            </nav>
            <nav>
              <h6 class="footer-title">Legal</h6>
              <a class="link link-hover">Terms of use</a>
              <a class="link link-hover">Privacy policy</a>
              <a class="link link-hover">Cookie policy</a>
            </nav>
          </footer>
        </div>

        {/* Drawer Side */}
        <div class="drawer-side">
          <label for="my-drawer" class="drawer-overlay" onClick={toggleDrawer}></label>
          <ul class="menu bg-base-200 text-base-content w-80 min-h-full p-4">
            <li><a class="active">Dashboard</a></li>
            <li><a>Profile</a></li>
            <li><a>Settings</a></li>
            <li><a>Messages</a></li>
            <li><a>Notifications</a></li>
            <li class="menu-title">
              <span>Components</span>
            </li>
            <li><a>Buttons</a></li>
            <li><a>Cards</a></li>
            <li><a>Forms</a></li>
            <li><a>Modals</a></li>
            <li><a>Tables</a></li>
            <li class="menu-title">
              <span>Account</span>
            </li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DaisyUITemplate