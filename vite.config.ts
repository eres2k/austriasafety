import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Increase chunk size warning limit (but we'll still optimize)
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // UI libraries
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            
            // Form handling
            if (id.includes('react-hook-form') || id.includes('yup')) {
              return 'form-vendor';
            }
            
            // Charts and data visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            
            // All other vendor modules
            return 'vendor';
          }
          
          // Split application code
          if (id.includes('src/components/inspection')) {
            return 'inspection';
          }
          
          if (id.includes('src/components/questionnaire')) {
            return 'questionnaire';
          }
          
          if (id.includes('src/components/common')) {
            return 'common';
          }
        },
        
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        
        // Optimize entry file names
        entryFileNames: 'assets/[name]-[hash].js',
        
        // Optimize asset file names
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@netlify/blobs', '@netlify/functions']
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
