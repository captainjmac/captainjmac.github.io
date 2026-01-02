export function BurgerMenu(props: { sidebarOpen: boolean }) {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {props.sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
        )}
    </svg>;
}