import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}

export default Layout;
