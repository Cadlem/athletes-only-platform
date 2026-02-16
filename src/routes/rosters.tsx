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

export const Route = createFileRoute('/rosters')({
  component: RostersPage,
})

type Athlete = {
  id: string
  name: string
  sport: string
  school: string
  conference: string
  avatar: string
  followers: number
  verificationStatus: 'verified' | 'pending'
}

const sampleAthletes: Athlete[] = [
  { id: '1', name: 'John Track Star', sport: 'Track & Field', school: 'UCLA', conference: 'Pac-12', avatar: 'J', followers: 12500, verificationStatus: 'verified' },
  { id: '2', name: 'Jane Basketball Pro', sport: 'Basketball', school: 'UConn', conference: 'Big East', avatar: 'J', followers: 45000, verificationStatus: 'verified' },
  { id: '3', name: 'Alex Soccer Star', sport: 'Soccer', school: 'Stanford', conference: 'Pac-12', avatar: 'A', followers: 8200, verificationStatus: 'verified' },
  { id: '4', name: 'Sarah Gymnast', sport: 'Gymnastics', school: 'Oklahoma', conference: 'Big 12', avatar: 'S', followers: 67000, verificationStatus: 'verified' },
  { id: '5', name: 'Mike Swimmer', sport: 'Swimming', school: 'USC', conference: 'Pac-12', avatar: 'M', followers: 9800, verificationStatus: 'verified' },
  { id: '6', name: 'Emily Tennis', sport: 'Tennis', school: 'Duke', conference: 'ACC', avatar: 'E', followers: 15400, verificationStatus: 'verified' },
  { id: '7', name: 'Chris Football', sport: 'Football', school: 'Alabama', conference: 'SEC', avatar: 'C', followers: 89000, verificationStatus: 'verified' },
  { id: '8', name: 'Maya Volleyball', sport: 'Volleyball', school: 'Texas', conference: 'Big 12', avatar: 'M', followers: 23000, verificationStatus: 'verified' },
  { id: '9', name: 'David Baseball', sport: 'Baseball', school: 'LSU', conference: 'SEC', avatar: 'D', followers: 11200, verificationStatus: 'pending' },
  { id: '10', name: 'Lisa Softball', sport: 'Softball', school: 'UCLA', conference: 'Pac-12', avatar: 'L', followers: 7600, verificationStatus: 'verified' },
]

const columnHelper = createColumnHelper<Athlete>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Athlete',
    cell: info => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-gray-900">
          {info.getValue().charAt(0)}
        </div>
        <div>
          <div className="font-medium flex items-center gap-2">
            {info.getValue()}
            {info.row.original.verificationStatus === 'verified' && (
              <span className="text-blue-400" title="Verified">✓</span>
            )}
          </div>
          <div className="text-xs text-gray-500">{info.row.original.sport}</div>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('school', {
    header: 'School',
    cell: info => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="text-xs text-gray-500">{info.row.original.conference}</div>
      </div>
    ),
  }),
  columnHelper.accessor('sport', {
    header: 'Sport',
    cell: info => {
      const sportIcons: Record<string, string> = {
        'Track & Field': '🏃',
        'Basketball': '🏀',
        'Soccer': '⚽',
        'Gymnastics': '🤸',
        'Swimming': '🏊',
        'Tennis': '🎾',
        'Football': '🏈',
        'Volleyball': '🏐',
        'Baseball': '⚾',
        'Softball': '🥎',
      }
      return (
        <span className="flex items-center gap-2">
          <span>{sportIcons[info.getValue()] || '🏅'}</span>
          {info.getValue()}
        </span>
      )
    },
  }),
  columnHelper.accessor('followers', {
    header: 'Followers',
    cell: info => (
      <span className="text-gray-300">{info.getValue().toLocaleString()}</span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: info => (
      <div className="flex items-center gap-2">
        <Link
          to="/deals"
          className="px-3 py-1 rounded text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          View Deals
        </Link>
        <button className="px-3 py-1 rounded text-sm font-medium bg-amber-500 hover:bg-amber-600 text-gray-900 transition-colors">
          Follow
        </button>
      </div>
    ),
  }),
]

export function RostersPage() {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [schoolFilter, setSchoolFilter] = useState<string>('all')

  const sports = useMemo(() => [...new Set(sampleAthletes.map(a => a.sport))], [])
  const schools = useMemo(() => [...new Set(sampleAthletes.map(a => a.school))], [])

  const filteredData = useMemo(() => {
    return sampleAthletes.filter(athlete => {
      const matchesSport = sportFilter === 'all' || athlete.sport === sportFilter
      const matchesSchool = schoolFilter === 'all' || athlete.school === schoolFilter
      return matchesSport && matchesSchool
    })
  }, [sportFilter, schoolFilter])

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
              <Link to="/rosters" className="text-amber-400 font-medium">
                Rosters
              </Link>
              <Link to="/live-feed" className="text-gray-300 hover:text-white transition-colors">
                Live
              </Link>
              <Link to="/deals" className="text-gray-300 hover:text-white transition-colors">
                Deals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Athletes Roster</h1>
          <p className="text-gray-400">Browse and follow your favorite college athletes</p>
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
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Schools</option>
            {schools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
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
          Showing {table.getRowModel().rows.length} of {sampleAthletes.length} athletes
        </div>
      </div>
    </div>
  )
}
