import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface CustomToastProps {
  title: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export function CustomToast({ title, description, type = 'info' }: CustomToastProps) {
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-white" />,
    warning: <AlertCircle className="h-6 w-6 text-white" />,
    info: <Info className="h-6 w-6 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-600',
    warning: 'bg-red-600',
    info: 'bg-blue-50'
  };

  const borderColors = {
    success: 'border-green-200',
    error: 'border-red-700',
    warning: 'border-red-700',
    info: 'border-blue-200'
  };

  const textColors = {
    success: 'text-gray-900',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-gray-900'
  };

  const descriptionColors = {
    success: 'text-gray-700',
    error: 'text-white/90',
    warning: 'text-white/90',
    info: 'text-gray-700'
  };

  return (
    <div className={`rounded-lg border p-4 ${bgColors[type]} ${borderColors[type]} shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{icons[type]}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColors[type]}`}>{title}</h3>
          <p className={`mt-1 text-sm ${descriptionColors[type]}`}>{description}</p>
        </div>
      </div>
    </div>
  );
} 