import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
          
          <button
            onClick={item.onClick}
            disabled={!item.onClick || item.isActive}
            className={`
              flex items-center gap-2 transition-colors
              ${item.isActive 
                ? 'font-semibold text-gray-900 cursor-default' 
                : 'hover:text-gray-900'
              }
              ${!item.onClick && !item.isActive ? 'cursor-default' : ''}
            `}
          >
            {index === 0 && <Home className="w-4 h-4" />}
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
