'use client'

import { API_BASE_URL } from '@/lib/config'

export default function TestProduction() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Production Test Page</h1>

      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-bold text-green-800">✅ Next.js is Working!</h2>
          <p className="text-sm text-green-700">If you can see this page, the build is deployed correctly.</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-bold text-blue-800">📡 API Configuration</h2>
          <p className="text-sm"><strong>API URL:</strong> {API_BASE_URL}</p>
          <p className="text-sm"><strong>Build ID:</strong> F7vNcNc0Ef2Do95xjgWco</p>
          <p className="text-sm"><strong>Node ENV:</strong> {process.env.NODE_ENV}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="font-bold text-yellow-800">🔍 Test Backend Connection</h2>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`${API_BASE_URL}/api/projects`)
                const data = await response.json()
                alert('✅ Backend Connected!\n' + JSON.stringify(data).substring(0, 100))
              } catch (error: any) {
                alert('❌ Backend Error:\n' + error.message)
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Test API Connection
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Navigation Test</h2>
          <div className="space-x-2">
            <a href="/" className="text-blue-600 hover:underline">Go to Dashboard</a>
            <span>|</span>
            <a href="/auth/auth1/login" className="text-blue-600 hover:underline">Go to Login</a>
          </div>
        </div>
      </div>
    </div>
  )
}
