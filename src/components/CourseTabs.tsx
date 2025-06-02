import { Compass, TrendingUp, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  {
    id: 'all-courses',
    label: 'All Courses',
    icon: Compass,
    description: 'Browse our complete course catalog'
  },
  {
    id: 'trending',
    label: 'Trending',
    icon: TrendingUp,
    description: 'Most popular courses right now'
  },
  {
    id: 'recommended',
    label: 'Recommended',
    icon: Trophy,
    description: 'Courses picked for you'
  },
  {
    id: 'top-instructors',
    label: 'Top Instructors',
    icon: Users,
    description: 'Learn from the best'
  }
];

const CourseTabs = ({ activeTab, onTabChange }: CourseTabsProps) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 py-2" aria-label="Course navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
                  "relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white"
                    : "hover:bg-primary/5 text-gray-600 hover:text-primary"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                )} />
                <div className="text-left">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className={cn(
                    "text-xs line-clamp-1",
                    isActive ? "text-white/80" : "text-gray-500"
                  )}>
                    {tab.description}
                  </div>
                </div>
          </button>
            );
          })}
      </nav>
      </div>
    </div>
  );
};

export default CourseTabs; 