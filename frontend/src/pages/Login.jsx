import AuthLogin from "@/components/Auth/Login"

const Login = () => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md mb-8 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-white mb-2 shadow">
          <span className="text-xs font-semibold">IQ</span>
        </div>
        <h1 className="text-lg font-medium text-zinc-900">
          Welcome back to InboxIQ
        </h1>
        <p className="text-sm text-zinc-500">
          A clean, focused workspace for your email and AI assistant.
        </p>
      </div>

      <AuthLogin />
    </div>
  )
}

export default Login

