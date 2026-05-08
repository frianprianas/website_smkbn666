import React from 'react';
import { User, Bell } from 'lucide-react';

const Header = ({ title }) => {
    return (
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
            <div>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                <p className="text-xs text-gray-500">Dashboard Control Panel</p>
            </div>
            
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                
                <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
                
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-800 leading-none">Administrator</p>
                        <p className="text-[10px] text-blue-500 font-medium mt-1">BaknusAi Controller</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <User className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
