export default function Home() {
  return (
    <div className="bg-app min-h-screen">
      {/* Top bar */}
      <header className="topbar">
        <h1 className="text-lg font-semibold">API Tests v2</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="badge">v2.0.0</span>
          <button className="btn-base btn-ghost btn-sm">Settings</button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="sidebar min-h-[calc(100vh-48px)] w-64">
          <div className="p-4">
            <h2 className="text-secondary mb-3 text-sm font-medium">Collections</h2>
            <div className="space-y-1">
              <div className="sidebar-item active">
                <span className="text-sm">My Workspace</span>
              </div>
              <div className="sidebar-item">
                <span className="text-sm">API Documentation</span>
              </div>
              <div className="sidebar-item">
                <span className="text-sm">Test Environments</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            {/* Welcome section */}
            <div className="mb-8">
              <h1 className="text-primary mb-2 text-2xl font-bold">Welcome to API Tests v2</h1>
              <p className="text-secondary">
                A modern API testing application with a Postman-like interface, built with Next.js
                and designed for efficiency.
              </p>
            </div>

            {/* Feature cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="card">
                <h3 className="mb-2 font-semibold">API Testing</h3>
                <p className="text-secondary mb-4 text-sm">
                  Send HTTP requests and analyze responses with our intuitive interface.
                </p>
                <button className="btn-base btn-primary btn-sm">Get Started</button>
              </div>

              <div className="card">
                <h3 className="mb-2 font-semibold">Collections</h3>
                <p className="text-secondary mb-4 text-sm">
                  Organize your API endpoints into collections for better workflow management.
                </p>
                <button className="btn-base btn-secondary btn-sm">Create Collection</button>
              </div>

              <div className="card">
                <h3 className="mb-2 font-semibold">Environment Variables</h3>
                <p className="text-secondary mb-4 text-sm">
                  Manage different environments and variables for your API testing workflows.
                </p>
                <button className="btn-base btn-ghost btn-sm">Manage</button>
              </div>
            </div>

            {/* Example API request */}
            <div className="card mb-8">
              <h3 className="mb-4 font-semibold">Example API Request</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="badge">GET</span>
                  <input
                    type="text"
                    className="input-base flex-1"
                    placeholder="https://jsonplaceholder.typicode.com/posts/1"
                    defaultValue="https://jsonplaceholder.typicode.com/posts/1"
                  />
                  <button className="btn-base btn-brand">Send</button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-secondary mb-2 text-sm font-medium">Headers</h4>
                    <div className="code-block">
                      {`Content-Type: application/json
Authorization: Bearer token123`}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-secondary mb-2 text-sm font-medium">Response</h4>
                    <div className="code-block">
                      {`{
  "id": 1,
  "title": "Example Post",
  "body": "This is an example response",
  "userId": 1
}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mb-8 flex flex-wrap gap-4">
              <button className="btn-base btn-primary">New Request</button>
              <button className="btn-base btn-secondary">Import Collection</button>
              <button className="btn-base btn-ghost">View Documentation</button>
              <button className="btn-base btn-destructive btn-sm">Clear All</button>
            </div>

            {/* Status indicators */}
            <div className="mb-8 flex flex-wrap gap-3">
              <span className="tag">Status: Ready</span>
              <span className="tag">Environment: Development</span>
              <span className="tag">Requests: 0</span>
            </div>

            {/* Table example */}
            <div className="card">
              <h3 className="mb-4 font-semibold">Recent Requests</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="badge">GET</span>
                    </td>
                    <td className="text-secondary">/api/users</td>
                    <td>
                      <span className="text-success">200</span>
                    </td>
                    <td className="text-muted">145ms</td>
                    <td>
                      <button className="btn-base btn-ghost btn-sm">View</button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge">POST</span>
                    </td>
                    <td className="text-secondary">/api/users</td>
                    <td>
                      <span className="text-success">201</span>
                    </td>
                    <td className="text-muted">267ms</td>
                    <td>
                      <button className="btn-base btn-ghost btn-sm">View</button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge">DELETE</span>
                    </td>
                    <td className="text-secondary">/api/users/123</td>
                    <td>
                      <span className="text-danger">404</span>
                    </td>
                    <td className="text-muted">89ms</td>
                    <td>
                      <button className="btn-base btn-ghost btn-sm">View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
