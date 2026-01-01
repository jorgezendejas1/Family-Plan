
import React from 'react';

const AppSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black overflow-hidden animate-fade-in">
      {/* Header Skeleton */}
      <header className="w-full h-20 px-6 hidden md:flex items-center justify-between z-30 shrink-0">
        <div className="w-full h-14 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 rounded-2xl flex items-center px-4">
          <div className="flex items-center gap-3">
             <div className="w-20 h-6 skeleton-bg animate-shimmer rounded-lg opacity-40"></div>
             <div className="w-32 h-8 skeleton-bg animate-shimmer rounded-lg opacity-40"></div>
          </div>
          <div className="flex-1 px-8 flex justify-center">
             <div className="w-full max-w-md h-9 skeleton-bg animate-shimmer rounded-xl opacity-20"></div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-24 h-9 skeleton-bg animate-shimmer rounded-xl opacity-30"></div>
             <div className="w-9 h-9 skeleton-bg animate-shimmer rounded-full opacity-30"></div>
          </div>
        </div>
      </header>

      {/* Mobile Header Skeleton */}
      <header className="w-full px-4 pt-8 pb-2 flex md:hidden items-center justify-between">
         <div className="w-32 h-10 skeleton-bg animate-shimmer rounded-full opacity-30"></div>
         <div className="w-24 h-10 skeleton-bg animate-shimmer rounded-full opacity-30"></div>
      </header>

      <div className="flex flex-1 relative overflow-hidden px-4 md:px-6 pb-6 gap-6">
        {/* Sidebar Skeleton (Desktop only) */}
        <aside className="hidden lg:flex flex-col w-72 h-full py-6 px-4">
           <div className="w-40 h-8 skeleton-bg animate-shimmer rounded-lg mb-8 opacity-30"></div>
           <div className="w-full aspect-square skeleton-bg animate-shimmer rounded-3xl mb-8 opacity-20"></div>
           <div className="space-y-4">
              <div className="w-full h-10 skeleton-bg animate-shimmer rounded-xl opacity-10"></div>
              <div className="w-full h-10 skeleton-bg animate-shimmer rounded-xl opacity-10"></div>
              <div className="w-full h-10 skeleton-bg animate-shimmer rounded-xl opacity-10"></div>
           </div>
        </aside>

        {/* Main Content (Calendar Grid) Skeleton */}
        <main className="flex-1 bg-white dark:bg-zinc-950 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-premium flex flex-col overflow-hidden">
           {/* Grid Week Days Header */}
           <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
              {Array.from({length: 7}).map((_, i) => (
                <div key={i} className="py-4 flex justify-center">
                   <div className="w-10 h-3 skeleton-bg animate-shimmer rounded-full opacity-20"></div>
                </div>
              ))}
           </div>
           {/* Grid Cells */}
           <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-gray-100/30 dark:bg-gray-800/20">
              {Array.from({length: 35}).map((_, i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-900/50 p-2">
                   <div className="w-6 h-6 skeleton-bg animate-shimmer rounded-full mb-2 opacity-10"></div>
                   {i % 4 === 0 && <div className="w-full h-4 skeleton-bg animate-shimmer rounded opacity-10 mb-1"></div>}
                   {i % 7 === 0 && <div className="w-[80%] h-4 skeleton-bg animate-shimmer rounded opacity-10"></div>}
                </div>
              ))}
           </div>
        </main>
      </div>

      {/* Floating Action Button Skeleton */}
      <div className="fixed bottom-6 right-6 w-16 h-16 skeleton-bg animate-shimmer rounded-3xl opacity-40 shadow-xl"></div>
      <div className="fixed bottom-[92px] right-6 w-16 h-16 skeleton-bg animate-shimmer rounded-3xl opacity-20"></div>
    </div>
  );
};

export default AppSkeleton;
