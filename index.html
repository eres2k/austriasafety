<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WHS Safety Audit System - Amazon Austria</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <style>
        [v-cloak] { display: none; }
        .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
        .fade-enter-from, .fade-leave-to { opacity: 0; }
        .amazon-orange { background-color: #FF9900; }
        .amazon-orange-hover:hover { background-color: #E6870B; }
        .amazon-blue { background-color: #232F3E; }
        .camera-preview { max-width: 300px; max-height: 200px; border-radius: 8px; }
        .photo-thumbnail { width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; }
        .file-upload-area { border: 2px dashed #d1d5db; transition: border-color 0.3s; }
        .file-upload-area:hover { border-color: #FF9900; }
        .file-upload-area.dragover { border-color: #FF9900; background-color: #fef3e2; }
        .loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center;
            justify-content: center; z-index: 9999;
        }
        .loading-spinner {
            border: 4px solid #f3f3f3; border-top: 4px solid #FF9900; border-radius: 50%;
            width: 50px; height: 50px; animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .connection-status {
            position: fixed; top: 10px; right: 10px; padding: 8px 12px; border-radius: 6px;
            font-size: 12px; font-weight: bold; z-index: 1000;
        }
        .connection-online { background-color: #10b981; color: white; }
        .connection-offline { background-color: #ef4444; color: white; }
        .connection-syncing { background-color: #f59e0b; color: white; }
    </style>
</head>
<body>
    <div id="app" v-cloak>
        <!-- Connection Status -->
        <div :class="['connection-status', connectionStatusClass]">
            {{ connectionStatusText }}
        </div>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="bg-white rounded-lg p-6 text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-700">{{ loadingMessage }}</p>
            </div>
        </div>

        <!-- Login Page -->
        <div v-if="currentView === 'login'" class="min-h-screen bg-gradient-to-br from-gray-900 via-amazon-blue to-gray-800 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div class="text-center mb-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 amazon-orange rounded-full mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">WHS Safety Audit System</h1>
                    <p class="text-gray-600 mt-2">Amazon Austria</p>
                    <p class="text-xs text-gray-500 mt-1">by Erwin Esener - WHS Austria</p>
                    <p class="text-xs text-blue-600 mt-1">🚀 Netlify-Powered</p>
                </div>
                
                <div v-if="loginError" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    {{ loginError }}
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input 
                            v-model="loginForm.email" 
                            type="email" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter your email"
                            @keyup.enter="handleLogin"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input 
                            v-model="loginForm.password" 
                            type="password" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter your password"
                            @keyup.enter="handleLogin"
                        >
                    </div>
                    
                    <button @click="handleLogin" class="w-full amazon-orange text-white py-3 rounded-lg font-semibold amazon-orange-hover transition-colors">
                        Sign In
                    </button>
                </div>
                
                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-600">Demo Accounts:</p>
                    <p class="text-xs text-gray-500 mt-1">admin@amazon.at / admin123</p>
                    <p class="text-xs text-gray-500">safety@amazon.at / safety123</p>
                </div>
            </div>
        </div>

        <!-- Main App -->
        <div v-else class="min-h-screen bg-gray-50">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b border-gray-200">
                <div class="px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <button @click="showMobileMenu = !showMobileMenu" class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path v-if="!showMobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                            <div class="flex items-center ml-4 lg:ml-0">
                                <svg class="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                                <div>
                                    <h1 class="text-xl font-bold text-gray-900">WHS Safety Audit System</h1>
                                    <p class="text-xs text-gray-600">Amazon Austria - Netlify Edition</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <div class="hidden sm:flex items-center text-sm text-gray-600">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                {{ currentUser.name }} ({{ currentUser.role }})
                            </div>
                            <button @click="syncToNetlify" class="text-sm text-blue-600 hover:text-blue-800 flex items-center" :disabled="isLoading">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Sync
                            </button>
                            <button @click="handleLogout" class="flex items-center text-sm text-gray-600 hover:text-gray-900">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div class="flex">
                <!-- Sidebar -->
                <aside :class="{'block': showMobileMenu, 'hidden': !showMobileMenu}" class="lg:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
                    <nav class="p-4 space-y-2">
                        <button 
                            @click="navigateTo('dashboard')" 
                            :class="{'bg-orange-50 text-orange-600': currentView === 'dashboard', 'text-gray-700 hover:bg-gray-50': currentView !== 'dashboard'}"
                            class="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            Dashboard
                        </button>
                        
                        <button 
                            @click="navigateTo('audits')" 
                            :class="{'bg-orange-50 text-orange-600': currentView === 'audits' || currentView === 'conduct-audit' || currentView === 'view-audit', 'text-gray-700 hover:bg-gray-50': currentView !== 'audits'}"
                            class="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Audits
                        </button>
                        
                        <button 
                            @click="navigateTo('questionnaires')" 
                            :class="{'bg-orange-50 text-orange-600': currentView === 'questionnaires', 'text-gray-700 hover:bg-gray-50': currentView !== 'questionnaires'}"
                            class="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1.732l4-2 4 2A2 2 0 0118 5v2H6V5z"></path>
                            </svg>
                            Questionnaires
                        </button>
                        
                        <button 
                            v-if="currentUser.role === 'admin'"
                            @click="navigateTo('users')" 
                            :class="{'bg-orange-50 text-orange-600': currentView === 'users', 'text-gray-700 hover:bg-gray-50': currentView !== 'users'}"
                            class="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            Users
                        </button>
                        
                        <button 
                            @click="navigateTo('reports')" 
                            :class="{'bg-orange-50 text-orange-600': currentView === 'reports', 'text-gray-700 hover:bg-gray-50': currentView !== 'reports'}"
                            class="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Reports
                        </button>
                    </nav>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 p-4 lg:p-8">
                    <!-- Dashboard View -->
                    <div v-if="currentView === 'dashboard'" class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-gray-900">WHS Dashboard</h2>
                            <div class="text-sm text-gray-600">
                                Amazon Austria - Workplace Health & Safety
                                <br><span class="text-xs text-blue-600">Storage: {{ storageStatus }}</span>
                            </div>
                        </div>
                        
                        <!-- Stats Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Total Audits</p>
                                        <p class="text-3xl font-bold text-gray-900 mt-2">{{ audits.length }}</p>
                                    </div>
                                    <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Average Score</p>
                                        <p class="text-3xl font-bold text-gray-900 mt-2">{{ averageScore }}%</p>
                                    </div>
                                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">Critical Issues</p>
                                        <p class="text-3xl font-bold text-gray-900 mt-2">{{ totalCriticalIssues }}</p>
                                    </div>
                                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">This Month</p>
                                        <p class="text-3xl font-bold text-gray-900 mt-2">{{ monthlyAudits }}</p>
                                    </div>
                                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Recent Audits -->
                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="text-lg font-semibold text-gray-900">Recent Audits</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr v-for="audit in recentAudits" :key="audit.id">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ audit.date }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ getDisplayLocation(audit) }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ audit.auditor }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span :class="getScoreClass(audit.score)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {{ audit.score }}%
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span :class="audit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {{ audit.status }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                <button @click="viewAuditDetails(audit)" class="text-orange-600 hover:text-orange-900">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div v-if="audits.length === 0" class="text-center py-8 text-gray-500">
                                    No audits found. Start your first audit!
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div v-if="currentUser.role !== 'viewer'" class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div class="flex space-x-4">
                                <button @click="startNewAudit" class="inline-flex items-center px-4 py-2 amazon-orange text-white rounded-lg amazon-orange-hover transition-colors">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Start New Audit
                                </button>
                                <button @click="exportAllData" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Export All Data
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Audits View -->
                    <div v-else-if="currentView === 'audits'" class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-gray-900">Safety Audits</h2>
                            <div class="flex space-x-3">
                                <button v-if="audits.length > 0" @click="exportAllData" class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M7 13l3 3 7-7"></path>
                                    </svg>
                                    Export All
                                </button>
                                <button v-if="currentUser.role !== 'viewer'" @click="startNewAudit" class="inline-flex items-center px-4 py-2 amazon-orange text-white rounded-lg amazon-orange-hover transition-colors">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    New Audit
                                </button>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow">
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr v-for="audit in audits" :key="audit.id">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ audit.date }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ getDisplayLocation(audit) }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ audit.area || 'N/A' }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ audit.auditor }}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span :class="getScoreClass(audit.score)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {{ audit.score }}%
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span v-if="audit.criticalFails > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {{ audit.criticalFails }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span :class="audit.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                    {{ audit.status }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <button @click="viewAuditDetails(audit)" class="text-orange-600 hover:text-orange-900">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                    </svg>
                                                </button>
                                                <button @click="downloadPDFReport(audit)" class="text-blue-600 hover:text-blue-900">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                </button>
                                                <button v-if="currentUser.role === 'admin'" @click="deleteAudit(audit.id)" class="text-red-600 hover:text-red-900">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div v-if="audits.length === 0" class="text-center py-8 text-gray-500">
                                    No audits found. Start your first audit!
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Simple Conduct Audit View -->
                    <div v-else-if="currentView === 'conduct-audit' && currentAudit" class="space-y-6">
                        <div class="flex justify-between items-center">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">WHS Safety Audit</h2>
                                <p class="text-sm text-gray-600">Amazon Austria - Workplace Health & Safety</p>
                            </div>
                            <button @click="cancelAudit" class="text-gray-600 hover:text-gray-900">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Basic Information -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Audit Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <select v-model="currentAudit.location" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">Select Location...</option>
                                        <option v-for="location in amazonLocations" :key="location" :value="location">{{ location }}</option>
                                        <option value="custom">Other</option>
                                    </select>
                                    <input v-if="currentAudit.location === 'custom'" v-model="currentAudit.customLocation" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2" placeholder="Enter location">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Area</label>
                                    <input v-model="currentAudit.area" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                    <select v-model="currentAudit.shift" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">Select...</option>
                                        <option value="Early">Early Shift</option>
                                        <option value="Late">Late Shift</option>
                                        <option value="Night">Night Shift</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Questions -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Safety Checklist</h3>
                            <div class="space-y-4">
                                <div v-for="question in quickQuestions" :key="question.id" class="border rounded-lg p-4">
                                    <div class="flex justify-between items-center">
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-900">{{ question.text }}</p>
                                            <span v-if="question.critical" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">Critical</span>
                                        </div>
                                        <div class="flex space-x-2 ml-4">
                                            <button @click="updateResponse(question.id, 'yes')" :class="currentAudit.responses[question.id] === 'yes' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'" class="px-3 py-1 rounded text-sm">Yes</button>
                                            <button @click="updateResponse(question.id, 'no')" :class="currentAudit.responses[question.id] === 'no' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'" class="px-3 py-1 rounded text-sm">No</button>
                                            <button @click="updateResponse(question.id, 'na')" :class="currentAudit.responses[question.id] === 'na' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'" class="px-3 py-1 rounded text-sm">N/A</button>
                                        </div>
                                    </div>
                                    <div v-if="currentAudit.responses[question.id] === 'no'" class="mt-3">
                                        <input v-model="currentAudit.notes[question.id]" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Add notes...">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Comments -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Additional Comments</h3>
                            <textarea v-model="currentAudit.generalComments" class="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="4" placeholder="Any additional observations or comments..."></textarea>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-end space-x-4">
                            <button @click="saveAudit('draft')" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Save as Draft</button>
                            <button @click="completeAudit" class="px-6 py-2 amazon-orange text-white rounded-lg amazon-orange-hover">Complete Audit</button>
                        </div>
                    </div>

                    <!-- Other views would continue here... -->
                    
                </main>
            </div>
        </div>
    </div>

    <script>
        const { createApp } = Vue;

        createApp({
            data() {
                return {
                    currentView: 'login',
                    currentUser: null,
                    showMobileMenu: false,
                    isLoading: false,
                    loadingMessage: '',
                    isOnline: navigator.onLine,
                    storageStatus: 'Local Storage',
                    lastSyncTime: null,
                    loginForm: { email: '', password: '' },
                    loginError: '',
                    users: [],
                    audits: [],
                    currentAudit: null,
                    viewingAudit: null,
                    amazonLocations: [
                        'DVI1 - Verteilerzentrum Wien 1',
                        'DVI2 - Verteilerzentrum Wien 2', 
                        'DVI3 - Verteilerzentrum Wien 3',
                        'DAP5 - Verteilerzentrum Graz',
                        'DAP8 - Verteilerzentrum Klagenfurt'
                    ],
                    quickQuestions: [
                        { id: '1.1', text: 'Are safety signs and escape route plans clearly visible?', critical: true },
                        { id: '1.2', text: 'Are all emergency exits free and well marked?', critical: true },
                        { id: '1.3', text: 'Is first aid equipment complete and accessible?', critical: true },
                        { id: '2.1', text: 'Is the warehouse clean and tidy?', critical: false },
                        { id: '2.2', text: 'Are floors non-slip and level?', critical: true },
                        { id: '3.1', text: 'Are 5S markings respected?', critical: false },
                        { id: '3.2', text: 'Are storage areas safely organized?', critical: false },
                        { id: '4.1', text: 'Are hazardous materials stored correctly?', critical: true },
                        { id: '5.1', text: 'Do employees avoid unfavorable body postures?', critical: false },
                        { id: '6.1', text: 'Are enough first aiders available?', critical: true }
                    ]
                };
            },
            computed: {
                connectionStatusClass() {
                    if (!this.isOnline) return 'connection-offline';
                    if (this.isLoading) return 'connection-syncing';
                    return 'connection-online';
                },
                connectionStatusText() {
                    if (!this.isOnline) return '🔴 Offline';
                    if (this.isLoading) return '🟡 Syncing...';
                    return '🟢 Online';
                },
                recentAudits() {
                    return [...this.audits].reverse().slice(0, 5);
                },
                averageScore() {
                    if (this.audits.length === 0) return 0;
                    const total = this.audits.reduce((sum, audit) => sum + (audit.score || 0), 0);
                    return Math.round(total / this.audits.length);
                },
                totalCriticalIssues() {
                    return this.audits.reduce((sum, audit) => sum + (audit.criticalFails || 0), 0);
                },
                monthlyAudits() {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    return this.audits.filter(audit => {
                        const auditDate = new Date(audit.date);
                        return auditDate.getMonth() === currentMonth && auditDate.getFullYear() === currentYear;
                    }).length;
                }
            },
            methods: {
                // Authentication
                handleLogin() {
                    const demoUsers = [
                        { id: 1, name: 'Admin User', email: 'admin@amazon.at', password: 'admin123', role: 'admin' },
                        { id: 2, name: 'Safety Officer', email: 'safety@amazon.at', password: 'safety123', role: 'auditor' },
                        { id: 3, name: 'Area Manager', email: 'manager@amazon.at', password: 'manager123', role: 'viewer' }
                    ];

                    const user = demoUsers.find(u => u.email === this.loginForm.email && u.password === this.loginForm.password);
                    
                    if (user) {
                        this.currentUser = user;
                        this.currentView = 'dashboard';
                        this.loginError = '';
                        this.loginForm = { email: '', password: '' };
                        this.loadFromStorage();
                    } else {
                        this.loginError = 'Invalid email or password';
                    }
                },

                handleLogout() {
                    this.currentUser = null;
                    this.currentView = 'login';
                },

                // Navigation
                navigateTo(view) {
                    this.currentView = view;
                    this.showMobileMenu = false;
                },

                // Audit Management
                startNewAudit() {
                    this.currentAudit = {
                        id: Date.now(),
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }),
                        auditor: this.currentUser.name,
                        location: '',
                        customLocation: '',
                        area: '',
                        shift: '',
                        status: 'in-progress',
                        responses: {},
                        notes: {},
                        generalComments: ''
                    };
                    this.currentView = 'conduct-audit';
                },

                updateResponse(questionId, value) {
                    this.currentAudit.responses[questionId] = value;
                },

                calculateScore(audit) {
                    let totalItems = 0;
                    let passedItems = 0;
                    let criticalFails = 0;
                    
                    this.quickQuestions.forEach(question => {
                        const response = audit.responses[question.id];
                        if (response && response !== '') {
                            totalItems++;
                            if (response === 'yes') {
                                passedItems++;
                            } else if (response === 'no' && question.critical) {
                                criticalFails++;
                            }
                        }
                    });
                    
                    const score = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;
                    return { score, totalItems, passedItems, criticalFails };
                },

                saveAudit(status) {
                    const scoreData = this.calculateScore(this.currentAudit);
                    const auditToSave = {
                        ...this.currentAudit,
                        status,
                        score: scoreData.score,
                        totalItems: scoreData.totalItems,
                        passedItems: scoreData.passedItems,
                        criticalFails: scoreData.criticalFails,
                        completedDate: status === 'completed' ? new Date().toISOString() : null
                    };
                    
                    this.audits.push(auditToSave);
                    this.saveToStorage();
                    
                    // Try to sync to Netlify
                    this.syncToNetlify();
                    
                    this.currentAudit = null;
                    this.currentView = 'audits';
                },

                completeAudit() {
                    if (confirm('Are you sure you want to complete this audit?')) {
                        this.saveAudit('completed');
                    }
                },

                cancelAudit() {
                    if (confirm('Are you sure you want to cancel this audit? All progress will be lost.')) {
                        this.currentAudit = null;
                        this.currentView = 'audits';
                    }
                },

                viewAuditDetails(audit) {
                    this.viewingAudit = audit;
                    this.currentView = 'view-audit';
                },

                deleteAudit(auditId) {
                    if (confirm('Are you sure you want to delete this audit?')) {
                        this.audits = this.audits.filter(a => a.id !== auditId);
                        this.saveToStorage();
                        this.syncToNetlify();
                    }
                },

                // Storage Management
                saveToStorage() {
                    try {
                        localStorage.setItem('whs_audits', JSON.stringify(this.audits));
                        localStorage.setItem('whs_users', JSON.stringify(this.users));
                        localStorage.setItem('whs_last_save', new Date().toISOString());
                        this.storageStatus = 'Saved Locally';
                    } catch (error) {
                        console.error('Error saving to localStorage:', error);
                        alert('Error saving data locally. Storage may be full.');
                    }
                },

                loadFromStorage() {
                    try {
                        const savedAudits = localStorage.getItem('whs_audits');
                        const savedUsers = localStorage.getItem('whs_users');
                        
                        if (savedAudits) {
                            this.audits = JSON.parse(savedAudits);
                        }
                        
                        if (savedUsers) {
                            this.users = JSON.parse(savedUsers);
                        }
                        
                        const lastSave = localStorage.getItem('whs_last_save');
                        if (lastSave) {
                            this.lastSyncTime = new Date(lastSave);
                        }
                    } catch (error) {
                        console.error('Error loading from localStorage:', error);
                        this.audits = [];
                        this.users = [];
                    }
                },

                // Netlify Integration (Simplified)
                async syncToNetlify() {
                    if (!this.isOnline) return;
                    
                    try {
                        this.isLoading = true;
                        this.loadingMessage = 'Syncing to Netlify...';
                        
                        // Send data to Netlify function
                        const response = await fetch('/.netlify/functions/store-data', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                audits: this.audits,
                                users: this.users,
                                timestamp: new Date().toISOString()
                            })
                        });

                        if (response.ok) {
                            this.storageStatus = 'Synced to Netlify';
                            this.lastSyncTime = new Date();
                        } else {
                            throw new Error('Sync failed');
                        }
                    } catch (error) {
                        console.error('Sync error:', error);
                        this.storageStatus = 'Local Storage (Sync Failed)';
                    } finally {
                        this.isLoading = false;
                        this.loadingMessage = '';
                    }
                },

                // Utility Methods
                getDisplayLocation(audit) {
                    if (audit.location === 'custom') {
                        return audit.customLocation || 'Custom Location';
                    }
                    return audit.location || 'N/A';
                },

                getScoreClass(score) {
                    if (score >= 90) return 'bg-green-100 text-green-800';
                    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
                    return 'bg-red-100 text-red-800';
                },

                // Export functionality
                exportAllData() {
                    const exportData = {
                        audits: this.audits,
                        users: this.users,
                        exportDate: new Date().toISOString(),
                        totalAudits: this.audits.length
                    };
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `WHS_Audit_Export_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                },

                downloadPDFReport(audit) {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    
                    // Simple PDF generation
                    doc.setFontSize(20);
                    doc.text('WHS Safety Audit Report', 20, 30);
                    doc.setFontSize(12);
                    doc.text(`Date: ${audit.date}`, 20, 50);
                    doc.text(`Location: ${this.getDisplayLocation(audit)}`, 20, 60);
                    doc.text(`Auditor: ${audit.auditor}`, 20, 70);
                    doc.text(`Score: ${audit.score}%`, 20, 80);
                    doc.text(`Status: ${audit.status}`, 20, 90);
                    
                    if (audit.generalComments) {
                        doc.text('Comments:', 20, 110);
                        const splitText = doc.splitTextToSize(audit.generalComments, 170);
                        doc.text(splitText, 20, 120);
                    }
                    
                    doc.save(`WHS_Audit_${audit.id}_${audit.date}.pdf`);
                },

                // Initialize app
                initializeApp() {
                    this.loadFromStorage();
                    
                    // Set up online/offline listeners
                    window.addEventListener('online', () => {
                        this.isOnline = true;
                        this.syncToNetlify();
                    });
                    
                    window.addEventListener('offline', () => {
                        this.isOnline = false;
                        this.storageStatus = 'Offline Mode';
                    });
                    
                    // Auto-sync every 5 minutes if online
                    setInterval(() => {
                        if (this.isOnline && this.currentUser) {
                            this.syncToNetlify();
                        }
                    }, 5 * 60 * 1000);
                }
            },

            mounted() {
                this.initializeApp();
            }
        }).mount('#app');
    </script>
</body>
</html>
