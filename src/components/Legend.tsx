import React from 'react';

const Legend: React.FC = () => {
    return (
        <div className="flex justify-center gap-5 mt-10 text-sm">
            <div className="flex items-center">
                <div
                    className="w-5 h-5 rounded-full mr-2 bg-green-200"
                    aria-label="Is prerequisite for indicator"
                />
                <span>Is prerequisite for</span>
            </div>
            <div className="flex items-center">
                <div
                    className="w-5 h-5 rounded-full mr-2 bg-blue-200"
                    aria-label="Co-requisite indicator"
                />
                <span>Co-requisite</span>
            </div>
            <div className="flex items-center">
                <div
                    className="w-5 h-5 rounded-full mr-2 bg-red-200"
                    aria-label="Prerequisite indicator"
                />
                <span>Prerequisite</span>
            </div>
        </div>
    );
};

export default Legend;