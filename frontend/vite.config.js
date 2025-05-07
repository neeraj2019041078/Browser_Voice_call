import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Check if we're running User1 or User2
  let port = 5173; // Default port for User1 (Admin)
  
  if (mode === 'user2') {
    port = 5174; // Custom port for User2 (Guest)
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allow access from other devices on the network
      port,            // Set port dynamically based on mode
    },
  };
});
