import {BurgerMenu} from "../common/icons/BurgerMenu.tsx";
import {useState} from "react";
import * as React from "react";

interface SidebarProps {
    children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Close sidebar on mobile after playlist selection
    // const handlePlaylistSelected = useCallback(() => {
    //     if (window.innerWidth < 1024) {
    //         setSidebarOpen(false);
    //     }
    // }, []);

    return (<>
        {/* Mobile sidebar toggle */}
        <button
            //onClick={() => handlePlaylistSelected}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg"
        >
            <BurgerMenu sidebarOpen={sidebarOpen}/>
        </button>

        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-200`}>

            <aside className="w-[32rem] h-full bg-gray-800 flex flex-col border-r border-gray-700">
                <div>
                    {children}
                </div>
            </aside>
        </div>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
            <div
                className="lg:hidden fixed inset-0 z-30 bg-black/50"
                onClick={() => setSidebarOpen(false)}
            />
        )}

    </>);
}
