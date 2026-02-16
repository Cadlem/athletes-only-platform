import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { LoadingTable } from '~/components/ui/loading'

export const Route = createFileRoute('/deals')({
  component: DealsPage,
  pendingComponent: LoadingTable,
})

type Deal = {
  id: string
  athlete: string
  sport: string
  school: string
  type: 'video_shoutout' | 'personal_message' | 'custom_photo'
  price: number
  tier: 'free' | 'bronze' | 'silver' | 'gold'
  status: 'available' | 'busy' | 'sold_out'
}

const sampleDeals: Deal[] = [
  { id: '1', athlete: 'John Track Star', sport: 'Track & Field', school: 'UCLA', type: 'video_shoutout', price: 50, tier: 'bronze', status: 'available' },
  { id: '2', athlete: 'John Track Star', sport: 'Track & Field', school: 'UCLA', type: 'personal_message', price: 25, tier: 'free', status: 'available' },
  { id: '3', athlete: 'Jane Basketball Pro', sport: 'Basketball', school: 'UConn', type: 'video_shoutout', price: 75, tier: 'silver', status: 'available' },
  { id: '4', athlete: 'Jane Basketball Pro', sport: 'Basketball', school: 'UConn', type: 'custom_photo', price: 35, tier: 'bronze', status: 'busy' },
  { id: '5', athlete: 'Alex Soccer Star', sport: 'Soccer', school: 'Stanford', type: 'personal_message', price: 30, tier: 'free', status: 'available' },
  { id: '6', athlete: 'Sarah Gymnast', sport: 'Gymnastics', school: 'Oklahoma', type: 'video_shoutout', price: 100, tier: 'gold', status: 'sold_out' },
  { id: '7', athlete: 'Sarah Gymnast', sport: 'Gymnastics', school: 'Oklahoma', type: 'custom_photo', price: 45, tier: 'silver', status: 'available' },
  { id: '8', athlete: 'Mike Swimmer', sport: 'Swimming', school: 'USC', type: 'video_shoutout', price: 60, tier: 'silver', status: 'available' },
  { id: '9', athlete: 'Emily Tennis', sport: 'Tennis', school: 'Duke', type: 'personal_message', price: 20, tier: 'free', status: 'available' },
  { id: '10', athlete: 'Emily Tennis', sport: 'Tennis', school: 'Duke', type: 'custom_photo', price: 40, tier: 'bronze', status: 'busy' },
]

const columnHelper = createColumnHelper<Deal>()

const columns = [
  columnHelper.accessor('athlete', {
    header: 'Athlete',
    cell: info => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="text-xs text-gray-500">{info.row.original.sport}</div>
      </div>
    ),
  }),
  columnHelper.accessor('type', {
    header: 'Deal Type',
    cell: info => {
      const type = info.getValue()
      const icons: Record<string, string> = {
        video_shoutout: '🎬',
        personal_message: '💬',
        custom_photo: '📸',
      }
      const labels: Record<string, string> = {
        video_shoutout: 'Video Shoutout',
        personal_message: 'Personal Message',
        custom_photo: 'Custom Photo',
      }
      return (
        <span className="flex items-center gap-2">
          <span>{icons[type]}</span>
          {labels[type]}
        </span>
      )
    },
  }),
  columnHelper.accessor('tier', {
    header: 'Required Tier',
    cell: info => {
      const tier = info.getValue()
      const colors: Record<string, string> = {
        free: 'bg-gray-600',
        bronze: 'bg-amber-700',
        silver: 'bg-gray-400',
        gold: 'bg-yellow-500',
      }
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${colors[tier]}`}>
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </span>
      )
    },
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => <span className="font-bold text-amber-400">${info.getValue()}</span>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => {
      const status = info.getValue()
      const colors: Record<string, string> = {
        available: 'text-green-400',
        busy: 'text-yellow-400',
        sold_out: 'text-red-400',
      }
      return <span className={colors[status]}>{status.replace('_', ' ')}</span>
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: info => {
      const status = info.row.original.status
      return (
        <button
          disabled={status !== 'available'}
          className="px-3 py-1 rounded text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900"
        >
          {status === 'available' ? 'Request' : status === 'busy' ? 'Waitlist' : 'Sold Out'}
        </button>
      )
    },
  }),
]

export function DealsPage() {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredData = useMemo(() => {
    if (typeFilter === 'all') return sampleDeals
    return sampleDeals.filter(d => d.type === typeFilter)
  }, [typeFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-amber-400">
              Athletes Only
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/rosters" className="text-gray-300 hover:text-white transition-colors">
                Rosters
              </Link>
              <Link to="/live-feed" className="text-gray-300 hover:text-white transition-colors">
                Live
              </Link>
              <Link to="/deals" className="text-amber-400 font-medium">
                Deals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deals</h1>
          <p className="text-gray-400">Request personalized content from your favorite athletes</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search athletes..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Types</option>
            <option value="video_shoutout">Video Shoutout</option>
            <option value="personal_message">Personal Message</option>
            <option value="custom_photo">Custom Photo</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-800">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Showing {table.getRowModel().rows.length} of {sampleDeals.length} deals
        </div>
      </div>
    </div>
  )
}
