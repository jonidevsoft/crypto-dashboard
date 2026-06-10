import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CURRENCY = 'usd'
const API = 'https://api.coingecko.com/api/v3'

function formatPrice(n) {
  if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + n.toFixed(6)
}

function formatMarketCap(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + n.toLocaleString()
}

function PriceChange({ value }) {
  const up = value >= 0
  return (
    <span className={`text-sm font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a2e] border border-[#333] rounded-lg px-3 py-2 text-xs">
      <p className="text-emerald-400 font-semibold">{formatPrice(payload[0].value)}</p>
    </div>
  )
}

export default function App() {
  const [coins, setCoins] = useState([])
  const [selected, setSelected] = useState(null)
  const [chart, setChart] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [days, setDays] = useState(7)

  useEffect(() => {
    fetchCoins()
    const interval = setInterval(fetchCoins, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selected) fetchChart(selected.id, days)
  }, [selected, days])

  const fetchCoins = async () => {
    try {
      const { data } = await axios.get(`${API}/coins/markets`, {
        params: { vs_currency: CURRENCY, order: 'market_cap_desc', per_page: 50, page: 1, sparkline: false }
      })
      setCoins(data)
      if (!selected) setSelected(data[0])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchChart = async (id, d) => {
    setChartLoading(true)
    try {
      const { data } = await axios.get(`${API}/coins/${id}/market_chart`, {
        params: { vs_currency: CURRENCY, days: d }
      })
      setChart(data.prices.map(([time, price]) => ({ time, price })))
    } catch (e) {
      console.error(e)
    } finally {
      setChartLoading(false)
    }
  }

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0c10] p-4 md:p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            🪙 Crypto <span className="text-emerald-400">Dashboard</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Precios en tiempo real · Actualiza cada 60s</p>
        </div>
        <input
          className="bg-[#111] border border-[#333] rounded-xl px-4 py-2 text-sm text-white
                     placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors w-48"
          placeholder="🔍 Buscar cripto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

        {/* LEFT — Chart + Stats */}
        <div className="flex flex-col gap-4">
          {selected && (
            <>
              {/* Selected coin info */}
              <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={selected.image} alt={selected.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h2 className="font-bold text-lg">{selected.name}</h2>
                      <span className="text-xs text-gray-500 uppercase">{selected.symbol}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono">{formatPrice(selected.current_price)}</p>
                    <PriceChange value={selected.price_change_percentage_24h} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Market Cap', formatMarketCap(selected.market_cap)],
                    ['Volumen 24h', formatMarketCap(selected.total_volume)],
                    ['Máx 24h', formatPrice(selected.high_24h)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#0a0c10] rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="font-mono text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Precio histórico</h3>
                  <div className="flex gap-1">
                    {[1, 7, 30, 90].map(d => (
                      <button key={d}
                        onClick={() => setDays(d)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors
                          ${days === d ? 'bg-emerald-500 text-black' : 'bg-[#1a1a2e] text-gray-400 hover:text-white'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                {chartLoading ? (
                  <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Cargando...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chart}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Coins list */}
        <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#222]">
            <p className="font-semibold text-sm">Top 50 Criptomonedas</p>
            <p className="text-xs text-gray-500">Por capitalización de mercado</p>
          </div>
          <div className="overflow-y-auto" style={{maxHeight: '600px'}}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Cargando...</div>
            ) : filtered.map((coin, i) => (
              <div key={coin.id}
                onClick={() => setSelected(coin)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#1a1a1a]
                  ${selected?.id === coin.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'hover:bg-[#1a1a1a]'}`}>
                <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{coin.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold">{formatPrice(coin.current_price)}</p>
                  <PriceChange value={coin.price_change_percentage_24h} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}