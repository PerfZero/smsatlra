import React from 'react';

interface CircleProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  textColor?: string;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  circleColor = '#E8E8E8',
  progressColor = '#E8E8E8',
  textColor = '#9CA3AF'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Прогресс */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Текст с процентами */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.25,
          color: textColor,
          fontWeight: '500'
        }}
      >
        {percentage}%
      </div>
    </div>
  );
};

export default CircleProgress; 