import React from 'react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

interface CourseTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const CourseTabs = ({ activeTab, onTabChange }: CourseTabsProps) => {
  const tabs = [
    { id: 'all-courses', label: 'All Courses' },
    { id: 'recommended', label: 'Recommended' },
    { id: 'trending', label: 'Trending' },
    { id: 'top-instructors', label: 'Top Instructors' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8" aria-label="Course tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-all duration-200",
              activeTab === tab.id
                ? "border-[#2D1F8F] text-[#2D1F8F]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CourseTabs; 