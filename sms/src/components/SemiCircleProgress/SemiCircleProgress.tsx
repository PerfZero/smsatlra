import React from 'react';

interface SemiCircleProgressProps {
  percentage: number;
  size: {
    width: number;
    height: number;
  };
  strokeWidth: number;
  strokeColor: string;
  strokeLinecap: 'round' | 'butt' | 'square';
  hasBackground?: boolean;
  bgStrokeColor?: string;
  fontStyle?: {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    fill: string;
  };
}

const SemiCircleProgress: React.FC<SemiCircleProgressProps> = ({
  percentage,
  size,
  strokeWidth,
  strokeColor,
  strokeLinecap,
  hasBackground = false,
  bgStrokeColor = '#E0E0E0',
  fontStyle
}) => {
  const radius = (size.width - strokeWidth) / 2;
  const center = {
    x: size.width / 2,
    y: size.height - strokeWidth
  };

  // Вычисляем координаты для дуги
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Вычисляем угол для текущего процента
  const angle = (percentage * 180) / 100;
  
  return (
    <svg width={size.width} height={size.height}>
      {/* Фоновая дуга */}
      {hasBackground && (
        <path
          d={describeArc(center.x, center.y, radius, 0, 180)}
          fill="none"
          stroke={bgStrokeColor}
          strokeWidth={strokeWidth}
        />
      )}
      
      {/* Основная дуга */}
      <path
        d={describeArc(center.x, center.y, radius, 0, angle)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
      />
      
      {/* Текст с процентами */}
      <text
        x={center.x}
        y={center.y - radius / 2}
        textAnchor="middle"
        style={fontStyle}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
};

export default SemiCircleProgress; 