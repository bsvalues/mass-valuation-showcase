import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { month: 'Jan', value: 4000, trend: 2400 },
  { month: 'Feb', value: 3000, trend: 1398 },
  { month: 'Mar', value: 2000, trend: 9800 },
  { month: 'Apr', value: 2780, trend: 3908 },
  { month: 'May', value: 1890, trend: 4800 },
  { month: 'Jun', value: 2390, trend: 3800 },
  { month: 'Jul', value: 3490, trend: 4300 },
];

export function ValuationChart3D() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0080FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0080FF" stopOpacity={0}/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 14, 26, 0.9)', 
              borderColor: 'rgba(0, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00FFFF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            filter="url(#glow)"
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          <Area 
            type="monotone" 
            dataKey="trend" 
            stroke="#0080FF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTrend)" 
            filter="url(#glow)"
            animationDuration={2500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
