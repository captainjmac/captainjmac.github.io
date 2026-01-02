export function Logo() {
    return <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
    >
        <style>
            {`
                @keyframes logo-pulse {
                    0%, 100% { fill: #7C3AED; }
                    50% { fill: #EC4899; }
                }
                @keyframes logo-pulse-inner {
                    0%, 100% { fill: #6D28D9; }
                    50% { fill: #DB2777; }
                }
                .logo-outer { animation: logo-pulse 4s ease-in-out infinite; }
                .logo-inner { animation: logo-pulse-inner 4s ease-in-out infinite; }
            `}
        </style>
        {/* Isometric hexagon base */}
        <path
            className="logo-outer"
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            stroke="#8B5CF6"
            strokeWidth="1.5"
        />
        {/* Inner gradient effect */}
        <path
            className="logo-inner"
            d="M16 5L25 10.5V21.5L16 27L7 21.5V10.5L16 5Z"
        />
        {/* Play triangle */}
        <path
            d="M13 11V21L22 16L13 11Z"
            fill="white"
        />
    </svg>;
}