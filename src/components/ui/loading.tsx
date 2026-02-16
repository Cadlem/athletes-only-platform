import { useState, useEffect } from 'react'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin`} />
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-800/50">
          <tr>
            {[...Array(5)].map((_, i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-gray-800 rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              {[...Array(5)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-800 rounded w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
