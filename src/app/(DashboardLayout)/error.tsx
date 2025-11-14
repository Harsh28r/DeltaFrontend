'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('Dashboard error:', error);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-dark p-8 rounded-lg shadow-lg">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-dark dark:text-white">Dashboard Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error.message || 'Failed to load dashboard. Please check your connection and try again.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryemphasis"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/auth/auth1/login'}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-dark dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Go to Login
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Error details: {error.digest}
        </p>
      </div>
    </div>
  )
}
