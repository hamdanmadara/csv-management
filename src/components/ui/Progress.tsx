interface ProgressProps {
    progress: number;
    status: 'uploading' | 'completed' | 'failed';
  }
  
  const Progress = ({ progress, status }: ProgressProps) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'bg-green-600';
        case 'failed':
          return 'bg-red-600';
        default:
          return 'bg-blue-600';
      }
    };
  
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    );
  };
  
  export default Progress;