import React from 'react';

const ChessPiece = ({ piece, className }) => {
    const isWhite = piece === piece.toUpperCase();
    const type = piece.toLowerCase();

    // SVG paths for standard chess pieces
    const paths = {
        p: "M12 21a5 5 0 0 1-5-5c0-2 1-3 2.5-4h5c1.5 1 2.5 2 2.5 4a5 5 0 0 1-5 5z M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        r: "M5 21h14v-4H5v4z M7 17h10v-5c0-2-1-3-3-3h-4c-2 0-3 1-3 3v5z M6 6h2v3H6z M11 6h2v3h-2z M16 6h2v3h-2z M5 8h14v1H5z",
        n: "M19 19c-2 1-5 2-7 2-3 0-5-2-5-5 0-3 2-6 5-8C15 6 18 4 19 3v4c-1 3-3 5-4 8h5v4z M9 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        b: "M12 21a5 5 0 0 1-5-5c0-3 2-6 5-11 3 5 5 8 5 11a5 5 0 0 1-5 5z M12 6c-1 0-1-1-1-1s0-1 1-1 1 1 1 1 0 1-1 1z",
        q: "M12 21c-4 0-6-2-6-5s2-7 6-12 6 9 6 12-2 5-6 5z M5 8c-1 0-1-1-1-1s0-1 1-1 1 1 1 1 0 1-1 1z M19 8c-1 0-1-1-1-1s0-1 1-1 1 1 1 1 0 1-1 1z M12 4c-1 0-1-1-1-1s0-1 1-1 1 1 1 1 0 1-1 1z",
        k: "M12 21c-4 0-6-3-6-6s2-6 6-10 6 7 6 10-2 6-6 6z M11 2h2v3h-2z M10 3h4v1h-4z M12 11v4 M10 13h4"
    };

    // Simplified illustrative paths above, now adding more detailed SVG structures
    const getPieceSVG = () => {
        const teamClass = isWhite ? 'piece-white' : 'piece-black';
        const stroke = isWhite ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.2)";
        const fill = isWhite ? "var(--piece-white)" : "var(--piece-black)";

        switch (type) {
            case 'p':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
                            <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
                        </g>
                    </svg>
                );
            case 'r':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
                            <path d="M34 14l-3 3H14l-3-3" />
                            <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
                            <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
                            <path d="M11 14h23" fill="none" stroke={stroke} strokeLinejoin="miter" />
                        </g>
                    </svg>
                );
            case 'n':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
                            <path d="M24 18c.38 2.43-4.63 1.85-6 3-.38-1.2 5.63-1.85 6-3z" />
                            <path d="M9 26c8.5-1.5 21-2 24.5-1A13.6 13.6 0 0 1 31 20c-5.5-2.5-13.5-2.5-18 2-1 1-1.5 3-4 4z" />
                            <path d="M15 15.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                            <path d="M22 9c5-1 11 2 11 7" fill="none" stroke={stroke} />
                        </g>
                    </svg>
                );
            case 'b':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <g fill={fill} strokeLinecap="butt">
                                <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 0 2 .5 3H8.5c.5-1 .5-3 .5-3z" />
                                <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
                                <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                            </g>
                            <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" fill="none" strokeLinejoin="miter" />
                        </g>
                    </svg>
                );
            case 'q':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM11 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM38 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" strokeLinecap="butt" />
                            <path d="M9 26c0 2 1.5 2 2.5 4 2.5 4 11.5 1 11-1 .5 2 9 5 11.5 1 1 2 2.5 2 2.5 4-8.5-1.5-18.5-1.5-27.5 0z" strokeLinecap="butt" />
                            <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
                            <path d="M9 39h27v-3H9v3z" strokeLinecap="butt" />
                        </g>
                    </svg>
                );
            case 'k':
                return (
                    <svg viewBox="0 0 45 45" className={`${teamClass} ${className}`}>
                        <g fill={fill} fillRule="evenodd" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22.5 11.63V6M20 8h5" fill="none" strokeLinejoin="miter" />
                            <path d="M22.5 25s4.5-7.5 4.5-12c0-2.5-2-4.5-4.5-4.5s-4.5 2-4.5 4.5c0 4.5 4.5 12 4.5 12z" strokeLinecap="butt" strokeLinejoin="miter" />
                            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-1-4-8-3-2-2.5-3.5-7-8-7s-6 4.5-8 7c-7-1-4 2-8 3-3 6 6 10.5 6 10.5v7z" strokeLinecap="butt" />
                            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" />
                        </g>
                    </svg>
                );
            default:
                return null;
        }
    };

    return getPieceSVG();
};

export default ChessPiece;
