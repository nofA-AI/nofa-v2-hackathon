'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NOFA AI API Documentation</h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive API documentation powered by Swagger UI
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/api/openapi"
                target="_blank"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                View OpenAPI JSON
              </a>
              <a
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                Back to App
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="swagger-container">
        <SwaggerUI
          url="/api/openapi"
          docExpansion="list"
          defaultModelsExpandDepth={3}
          defaultModelExpandDepth={3}
          displayRequestDuration={true}
          filter={true}
          tryItOutEnabled={true}
        />
      </div>

    </div>
  );
}
