import React from 'react';

interface PageNumberDebugProps {
  pageNumber: number;
  pageName: string;
}

// This is only used for development purposes to identify page numbers
const PageNumberDebug: React.FC<PageNumberDebugProps> = ({ pageNumber, pageName }) => {
  // Return null in production to hide debugging information
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden in both environments, but available in DOM for debugging */}
      <span data-page-number={pageNumber} data-page-name={pageName}></span>
    </div>
  );
};

export default PageNumberDebug;