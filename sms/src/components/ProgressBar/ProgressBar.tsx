import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  const radius = 90;
  const strokeWidth = 15;
  const viewBox = `0 0 ${radius * 2} ${radius}`;
  const diameter = Math.PI * radius;

  return (
    <div className="progress-bar">
      <svg
        className="progress-bar__svg"
        width="100%"
        height="100%"
        viewBox={viewBox}
      >
        {/* Background path */}
        <path
          className="progress-bar__background"
          d={`M ${strokeWidth / 2}, ${radius} 
              A ${radius - strokeWidth / 2}, ${radius - strokeWidth / 2} 0 0 1 ${radius * 2 - strokeWidth / 2}, ${radius}`}
          strokeWidth={strokeWidth}
        />
        {/* Progress path */}
        <path
          className="progress-bar__progress"
          d={`M ${strokeWidth / 2}, ${radius} 
              A ${radius - strokeWidth / 2}, ${radius - strokeWidth / 2} 0 0 1 ${radius * 2 - strokeWidth / 2}, ${radius}`}
          strokeWidth={strokeWidth}
          strokeDasharray={diameter}
          strokeDashoffset={diameter * (1 - normalizedPercentage / 100)}
        />
        <text
          className="progress-bar__text"
          x="50%"
          y="50%"
          dy="0.3em"
          textAnchor="middle"
        >
          {normalizedPercentage}%
        </text>
      </svg>
    </div>
  );
};

export default ProgressBar; 