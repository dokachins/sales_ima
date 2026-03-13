import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 [font-family:var(--font-space-grotesk)]">Scout</h1>
          <p className="text-sm text-gray-500 mt-1">新規顧客開拓管理システム</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
