'use strict';

(function() {
    // Function to add CSS styles
    var addStyle = (css) => {
        if (typeof GM_addStyle !== "undefined") {
            GM_addStyle(css);
        } else if (typeof GM !== "undefined" && GM.addStyle !== undefined) {
            GM.addStyle(css);
        } else {
            const style = document.createElement("style");
            style.textContent = css;
            document.head.appendChild(style);
        }
    };

    // Add main styles
    addStyle(`
        /* Persistent container styles */
        #pcc-custom-ui {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            pointer-events: none;
            z-index: 99999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        #pcc-custom-ui * {
            pointer-events: auto;
            box-sizing: border-box;
        }

        .pcc-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .pcc-modal {
            background: linear-gradient(145deg, #1f2937, #111827);
            color: #e5e7eb;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 20px rgba(79, 70, 229, 0.2);
            width: 380px;
            animation: pcc-slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255,255,255,0.1);
        }

        .pcc-progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed, #db2777);
            background-size: 200% 100%;
            animation: pcc-gradient-shift 2s ease infinite;
            transition: width 0.3s ease;
            z-index: 100000;
            width: 0%;
            box-shadow: 0 0 10px rgba(124, 58, 237, 0.7);
        }

        .pcc-status-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            margin: 10px 0;
            border-radius: 12px;
            background: rgba(30, 41, 59, 0.8);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transform: translateY(0);
            opacity: 1;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 4px solid #4f46e5;
        }

        .pcc-status-item.exiting {
            opacity: 0;
            transform: translateX(100%);
        }

        .pcc-status-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pcc-stop-btn {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: white !important;
            padding: 12px 24px;
            border-radius: 40px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
            border: none;
            cursor: pointer;
            margin-top: 12px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .pcc-stop-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
        }
        
        .pcc-stop-btn:active {
            transform: translateY(1px);
            box-shadow: 0 2px 10px rgba(220, 38, 38, 0.3);
        }
        
        button.pcc-stop-btn[style*="background: #666"] {
            background: linear-gradient(135deg, #4b5563, #374151) !important;
            box-shadow: 0 4px 15px rgba(75, 85, 99, 0.4);
        }

        @keyframes pcc-slideIn {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pcc-gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .pcc-spinner {
            animation: pcc-spin 1s linear infinite;
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255,255,255,0.15);
            border-top-color: #fff;
            border-radius: 50%;
            filter: drop-shadow(0 0 2px rgba(255,255,255,0.7));
        }

        @keyframes pcc-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Custom form elements */
        #pcc-months-input {
            background: rgba(17, 24, 39, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e5e7eb;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.2s ease;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            width: 100%;
        }
        
        #pcc-months-input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 0 0 2px rgba(99, 102, 241, 0.25);
        }
        
        /* Custom status styles */
        .pcc-status-item[style*="background: #fff0f0"] {
            background: rgba(30, 20, 20, 0.8) !important;
            color: #fecaca !important;
            border-left-color: #dc2626 !important;
        }
        
        /* Modal title style */
        .pcc-modal h2 {
            background: linear-gradient(90deg, #c084fc, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
            font-size: 1.5rem;
            margin-bottom: 1.5rem !important;
            font-weight: 700;
        }
        
        /* Label styling */
        .pcc-modal label {
            color: #94a3b8 !important;
            font-size: 0.9rem;
            margin-bottom: 0.75rem !important;
            font-weight: 500;
            display: block;
        }
    `);

    // Add webkit-specific animations
    addStyle(`
        @-webkit-keyframes pcc-spin {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
        }
        
        @-webkit-keyframes pcc-gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        @-webkit-keyframes pcc-slideIn {
            from { -webkit-transform: translateY(-30px); opacity: 0; }
            to { -webkit-transform: translateY(0); opacity: 1; }
        }
    `);

    // Helper function to store settings in localStorage
    const storeSettings = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn("Failed to store settings");
        }
    };

    // Create or get the UI container
    const uiContainer = (() => {
        let container = document.getElementById("pcc-custom-ui");
        if (!container) {
            container = document.createElement("div");
            container.id = "pcc-custom-ui";
            document.documentElement.appendChild(container);
        }
        return container;
    })();

    // Cleanup flag
    let cleanupPerformed = false;

    // Cleanup function
    const performCleanup = () => {
        if (!cleanupPerformed) {
            cleanupPerformed = true;
            console.log("Performing cleanup...");
            setTimeout(() => {
                if (uiContainer) {
                    uiContainer.remove();
                    console.log("Cleanup complete: UI container removed.");
                }
            }, 3000);
        }
    };

    // Configuration modal class
    class ConfigModal {
        static showConfigModal() {
            const overlay = document.createElement("div");
            overlay.className = "pcc-modal-overlay";
            
            const modal = document.createElement("div");
            modal.className = "pcc-modal";
            
            // Try to get stored months setting
            let storedMonths;
            try {
                storedMonths = localStorage.getItem("matrixClickerMonths");
            } catch (err) {
                storedMonths = null;
            }
            
            modal.innerHTML = `
                <h2>Service Loader Configuration</h2>
                <div style="margin-bottom: 1.5rem;">
                    <label>
                        Months to Load Back
                    </label>
                    <div style="display: flex; gap: 8px;">
                        <input type="number" 
                               id="pcc-months-input" 
                               value="${storedMonths || 12}" 
                               min="1" 
                               max="36">
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button type="button" 
                            class="pcc-stop-btn" 
                            style="background: #666;"
                            onclick="this.closest('.pcc-modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" 
                            class="pcc-stop-btn"
                            onclick="this.dispatchEvent(new Event('confirm', { bubbles: true }))">
                        Start Loading
                    </button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            return new Promise(resolve => {
                modal.addEventListener("confirm", () => {
                    const monthsInput = modal.querySelector("#pcc-months-input");
                    const months = parseInt(monthsInput.value, 10);
                    storeSettings("matrixClickerMonths", months.toString());
                    resolve(months);
                    overlay.remove();
                });
            });
        }
    }

    // UI Manager class
    class UIManager {
        constructor() {
            this.container = this.createContainer();
            this.progressBar = this.createProgressBar();
        }
        
        createContainer() {
            const container = document.createElement("div");
            container.style.cssText = `
                position: fixed;
                top: 60px;
                right: 20px;
                z-index: 100000;
                width: 330px;
            `;
            uiContainer.appendChild(container);
            return container;
        }
        
        createProgressBar() {
            const bar = document.createElement("div");
            bar.className = "pcc-progress-bar";
            uiContainer.appendChild(bar);
            return bar;
        }
        
        show(message, type = "info") {
            const icon = {
                info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#6366f1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
                success: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#10b981"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
                error: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#ef4444"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
                loading: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#6366f1" class="spin"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>'
            }[type] || "";

            const notification = document.createElement("div");
            notification.className = "pcc-status-item";
            notification.innerHTML = `
                <span class="pcc-status-icon">${icon}</span>
                <span>${message}</span>
            `;

            if (type === "error") {
                notification.style.borderLeftColor = "#ef4444";
            } else if (type === "success") {
                notification.style.borderLeftColor = "#10b981";
            }

            this.container.prepend(notification);

            // Add spinning animation for loading icon if needed
            if (type === "loading") {
                const svg = notification.querySelector(".spin");
                if (svg) {
                    svg.style.animation = "pcc-spin 1s linear infinite";
                }
            }

            setTimeout(() => {
                notification.classList.add("exiting");
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        updateProgress(percent) {
            this.progressBar.style.width = `${Math.min(percent, 100)}%`;
        }
    }

    // Service loading function
    const loadServices = (monthsBack, controller, ui) => {
        console.log("Attempting to load services with", monthsBack, "months back...");

        // Calculate target date (first day of week) from months back
        const today = new Date();
        let dayOfWeek = today.getDay();
        let diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(diff);

        const targetDate = new Date(currentWeekStart);
        targetDate.setMonth(currentWeekStart.getMonth() - monthsBack);

        // Ensure we get to the start of a week
        while (targetDate.getDay() !== 0) {
            targetDate.setDate(targetDate.getDate() - 1);
        }

        const targetDateStr = targetDate.toISOString().split("T")[0];

        // Calculate acceptable date range window (within the target week)
        const targetDateMin = new Date(targetDate);
        targetDateMin.setDate(targetDateMin.getDate() - 6);

        const targetDateMax = new Date(targetDate);
        targetDateMax.setDate(targetDateMax.getDate() + 6);

        console.log("Start date window:", targetDateMin, "End date window:", targetDateMax);
        console.log("Target date:", targetDateStr);

        // Find the add button
        const addButton = document.querySelector(".tapestry-react-reset.tapestry-react-services-zvb3oh");
        if (!addButton) {
            console.log("Add button not found");
            performCleanup();
            return;
        }

        // For tracking progress
        let earliestDateFound = null;

        // Recursive function to continue loading services until target date
        const continueLoading = () => {
            if (!controller.isActive) {
                console.log("Loading stopped by user.");
                ui.show("Loading stopped", "error");
                performCleanup();
                return;
            }

            // Find date element
            const dateElement = document.querySelectorAll(".tapestry-react-services-1fej2i1")[1];
            if (dateElement) {
                // Extract date from element
                const currentDate = new Date(dateElement.innerText);
                const currentDateStr = currentDate.toISOString().split("T")[0];
                console.log("Checking date:", currentDateStr);

                // Update progress bar
                const updateProgress = (date) => {
                    earliestDateFound = earliestDateFound || date;

                    const totalRange = earliestDateFound.getTime() - targetDate.getTime();
                    let progress = (earliestDateFound.getTime() - date.getTime()) / totalRange * 100;
                    progress = Math.max(0, Math.min(100, progress));
                    ui.updateProgress(progress);
                };

                updateProgress(currentDate);

                // Check if we've reached our target date range
                if (currentDate < targetDateMin || currentDate > targetDateMax) {
                    // Click the add button to load more services
                    try {
                        addButton.click();
                    } catch (err) {
                        console.error("Error clicking add button:", err);
                    }

                    setTimeout(() => {
                        if (document.querySelector(".tapestry-react-reset.tapestry-react-services-urpdis")) {
                            // Wait for loading to complete
                            setTimeout(continueLoading, 1000);
                        } else {
                            continueLoading();
                        }
                    }, 1000);
                } else {
                    console.log("Reached target date or within acceptable range:", currentDateStr);
                    controller.isActive = false;
                    ui.updateProgress(100);
                    ui.show("Reached target date or within acceptable range", "success");
                    performCleanup();
                }
            } else {
                console.log("Target date element not found");
                performCleanup();
            }
        };

        // Start loading
        continueLoading();
    };

    // Main initialization function
    const init = async () => {
        const ui = new UIManager();
        ui.show("Initializing...", "info");
        
        try {
            // Show config modal and get number of months to load back
            const months = await ConfigModal.showConfigModal();
            
            if (months < 1 || months > 36) {
                ui.show("Invalid input - using default 12 months", "error");
                storeSettings("matrixClickerMonths", "12");
                performCleanup();
                return;
            }
            
            // Create controller for stopping the process
            const controller = { isActive: true };
            
            // Create stop button
            const stopButton = document.createElement("button");
            stopButton.className = "pcc-stop-btn";
            stopButton.innerHTML = '<span class="pcc-spinner"></span> Stop Loading';
            stopButton.onclick = () => {
                if (confirm("Are you sure you want to stop loading services?")) {
                    controller.isActive = false;
                    ui.show("Loading stopped", "error");
                    stopButton.remove();
                    performCleanup();
                }
            };
            uiContainer.appendChild(stopButton);
            
            // Start loading services
            loadServices(months, controller, ui);
            
        } catch (err) {
            ui.show(`Initialization failed: ${err.message}`, "error");
            performCleanup();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();