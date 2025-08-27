import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Dados simulados para os gráficos
const executionData = [
  { hour: '00:00', executions: 12, success: 11, errors: 1 },
  { hour: '02:00', executions: 8, success: 8, errors: 0 },
  { hour: '04:00', executions: 15, success: 14, errors: 1 },
  { hour: '06:00', executions: 25, success: 23, errors: 2 },
  { hour: '08:00', executions: 45, success: 42, errors: 3 },
  { hour: '10:00', executions: 38, success: 36, errors: 2 },
  { hour: '12:00', executions: 52, success: 49, errors: 3 },
  { hour: '14:00', executions: 41, success: 39, errors: 2 },
  { hour: '16:00', executions: 35, success: 33, errors: 2 },
  { hour: '18:00', executions: 28, success: 27, errors: 1 },
  { hour: '20:00', executions: 22, success: 21, errors: 1 },
  { hour: '22:00', executions: 18, success: 17, errors: 1 }
];

const performanceData = [
  { day: 'Seg', avgTime: 2.1, executions: 156 },
  { day: 'Ter', avgTime: 2.3, executions: 142 },
  { day: 'Qua', avgTime: 1.9, executions: 168 },
  { day: 'Qui', avgTime: 2.5, executions: 134 },
  { day: 'Sex', avgTime: 2.2, executions: 189 },
  { day: 'Sáb', avgTime: 1.8, executions: 98 },
  { day: 'Dom', avgTime: 1.6, executions: 76 }
];

const statusData = [
  { name: 'Executando', value: 8, color: '#10B981' },
  { name: 'Agendado', value: 4, color: '#3B82F6' },
  { name: 'Pausado', value: 2, color: '#F59E0B' },
  { name: 'Erro', value: 1, color: '#EF4444' },
  { name: 'Parado', value: 3, color: '#6B7280' }
];

interface ExecutionChartProps {
  className?: string;
}

export const ExecutionChart: React.FC<ExecutionChartProps> = ({ className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={executionData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="hour" 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Bar 
            dataKey="success" 
            stackId="a" 
            fill="#10B981" 
            name="Sucessos"
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="errors" 
            stackId="a" 
            fill="#EF4444" 
            name="Erros"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PerformanceChartProps {
  className?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            className="text-xs"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            className="text-xs"
            tick={{ fontSize: 12 }}
            label={{ value: 'Tempo (min)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            className="text-xs"
            tick={{ fontSize: 12 }}
            label={{ value: 'Execuções', angle: 90, position: 'insideRight' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="avgTime" 
            stroke="#3B82F6" 
            strokeWidth={3}
            name="Tempo Médio (min)"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="executions" 
            stroke="#10B981" 
            strokeWidth={3}
            name="Execuções"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StatusPieChartProps {
  className?: string;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ className }) => {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {statusData.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente principal que exporta todos os gráficos
export const DashboardCharts = {
  ExecutionChart,
  PerformanceChart,
  StatusPieChart
};

export default DashboardCharts;