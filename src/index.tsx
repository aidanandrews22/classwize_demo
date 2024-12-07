//src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import reportWebVitals from './reportWebVitals';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    throw new Error('Missing Publishable Key');
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ClerkProvider publishableKey={clerkPubKey}>
            <App />
        </ClerkProvider>
    </React.StrictMode>
);

reportWebVitals();