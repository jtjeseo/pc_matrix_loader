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
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(79, 70, 229, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
            width: 400px;
            animation: pcc-slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255,255,255,0.15);
            position: relative;
            overflow: hidden;
        }
        
        .pcc-modal::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }

        .pcc-progress-bar {
            position: fixed;
            top: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed, #db2777, #f59e0b);
            background-size: 200% 100%;
            animation: pcc-gradient-shift 3s ease infinite;
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 100000;
            width: 0%;
            box-shadow: 0 0 15px rgba(124, 58, 237, 0.8), 0 0 30px rgba(79, 70, 229, 0.4);
            border-radius: 0 0 2px 0;
        }
        
        .pcc-progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
            animation: pcc-shimmer 2s ease-in-out infinite;
        }

        .pcc-status-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 18px 20px;
            margin: 12px 0;
            border-radius: 16px;
            background: rgba(30, 41, 59, 0.9);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.1);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            transform: translateY(0);
            opacity: 1;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 4px solid #4f46e5;
            border: 1px solid rgba(255,255,255,0.08);
            position: relative;
            overflow: hidden;
        }
        
        .pcc-status-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        }
        
        .pcc-status-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.3), 0 6px 15px rgba(0,0,0,0.15);
        }

        .pcc-status-item.exiting {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            max-height: 0;
            margin: 0;
            padding: 0;
            overflow: hidden;
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
            padding: 14px 28px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4), 0 2px 10px rgba(0,0,0,0.1);
            border: none;
            cursor: pointer;
            margin-top: 16px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            position: relative;
            overflow: hidden;
        }
        
        .pcc-stop-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }
        
        .pcc-stop-btn:hover::before {
            left: 100%;
        }
        
        .pcc-stop-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.5), 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .pcc-stop-btn:active {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4), 0 2px 8px rgba(0,0,0,0.15);
        }
        
        button.pcc-stop-btn[style*="background: #666"] {
            background: linear-gradient(135deg, #4b5563, #374151) !important;
            box-shadow: 0 6px 20px rgba(75, 85, 99, 0.4), 0 2px 10px rgba(0,0,0,0.1);
        }
        
        button.pcc-stop-btn[style*="background: #666"]:hover {
            box-shadow: 0 8px 25px rgba(75, 85, 99, 0.5), 0 4px 15px rgba(0,0,0,0.2);
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
        
        @keyframes pcc-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .pcc-spinner {
            animation: pcc-spin 1s linear infinite;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: #fff;
            border-radius: 50%;
            filter: drop-shadow(0 0 4px rgba(255,255,255,0.8));
        }

        @keyframes pcc-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Custom form elements */
        #pcc-months-input {
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid rgba(255,255,255,0.15);
            color: #e5e7eb;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1);
            width: 100%;
            position: relative;
        }
        
        #pcc-months-input:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 0 0 3px rgba(99, 102, 241, 0.3), 0 1px 3px rgba(0,0,0,0.1);
            transform: translateY(-1px);
        }
        
        #pcc-months-input:hover {
            border-color: rgba(255,255,255,0.25);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.15);
        }
        
        /* Custom status styles */
        .pcc-status-item[style*="background: #fff0f0"] {
            background: rgba(30, 20, 20, 0.8) !important;
            color: #fecaca !important;
            border-left-color: #dc2626 !important;
        }
        
        /* Modal title style */
        .pcc-modal h2 {
            background: linear-gradient(135deg, #c084fc, #6366f1, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
            font-size: 1.75rem;
            margin-bottom: 2rem !important;
            font-weight: 700;
            text-align: center;
            letter-spacing: -0.025em;
            position: relative;
        }
        
        .pcc-modal h2::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            border-radius: 1px;
        }
        
        /* Label styling */
        .pcc-modal label {
            color: #cbd5e1 !important;
            font-size: 0.95rem;
            margin-bottom: 1rem !important;
            font-weight: 600;
            display: block;
            letter-spacing: 0.025em;
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
        
        @-webkit-keyframes pcc-shimmer {
            0% { -webkit-transform: translateX(-100%); }
            100% { -webkit-transform: translateX(100%); }
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
                    // Start print process after UI cleanup
                    performPrint();
                }
            }, 3000);
        }
    };

    // Print function to execute after cleanup
    const performPrint = () => {
        console.log("Starting print process...");
        
        try {
            // 1. Find and click the print button
            const printButton = Array.from(document.querySelectorAll('button[aria-label="Print"]')).find(btn => 
                btn.querySelector('svg') && btn.className.includes('tapestry-react-services')
            );
            
            if (!printButton) {
                console.error("Print button not found");
                return;
            }
            
            console.log("Clicking print button...");
            printButton.click();
            
            // 2. Wait for the print dialog to appear and check dropdown option
            setTimeout(() => {
                const dropdown = document.querySelector('.tapestry-react-services-19sym4c');
                if (!dropdown || !dropdown.textContent.includes("Who sings what? v3")) {
                    console.error("Correct dropdown option not found");
                    return;
                }
                
                // 3. Find and click the Web Page button
                const webPageButton = Array.from(document.querySelectorAll('.tapestry-react-reset.tapestry-react-services-qxiunf')).find(btn => 
                    btn.textContent.includes("Web Page")
                );
                
                if (!webPageButton) {
                    console.error("Web Page button not found");
                    return;
                }
                
                console.log("Clicking Web Page button...");
                webPageButton.click();
                
                // 4. Wait a moment and click the Submit button
                setTimeout(() => {
                    const submitButton = Array.from(document.querySelectorAll('.tapestry-react-reset.tapestry-react-services-18dhx0b')).find(btn => 
                        btn.textContent.includes("Submit")
                    );
                    
                    if (!submitButton) {
                        console.error("Submit button not found");
                        return;
                    }
                    
                    console.log("Clicking Submit button...");
                    submitButton.click();
                    console.log("Print process completed");
                }, 500);
            }, 500);
        } catch (err) {
            console.error("Error in print process:", err);
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
                <div style="margin-bottom: 2rem;">
                    <label>
                        Months to Load Back
                    </label>
                    <div style="display: flex; gap: 8px;">
                        <input type="number" 
                               id="pcc-months-input" 
                               value="${storedMonths || 12}" 
                               min="1" 
                               max="36"
                               placeholder="12">
                    </div>
                    <div style="margin-top: 0.5rem; color: #94a3b8; font-size: 0.85rem;">
                        Load services from the past 1-36 months
                    </div>
                </div>
                <div style="display: flex; gap: 16px; justify-content: flex-end;">
                    <button type="button" 
                            class="pcc-stop-btn" 
                            style="background: linear-gradient(135deg, #4b5563, #374151); padding: 12px 24px; font-size: 13px;"
                            onclick="this.closest('.pcc-modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" 
                            class="pcc-stop-btn"
                            style="background: linear-gradient(135deg, #059669, #047857); padding: 12px 24px; font-size: 13px;"
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
                top: 80px;
                right: 24px;
                z-index: 100000;
                width: 350px;
                max-height: 80vh;
                overflow-y: auto;
                overflow-x: hidden;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.3) transparent;
            `;
            
            // Custom scrollbar styles
            const scrollbarStyle = document.createElement("style");
            scrollbarStyle.textContent = `
                .pcc-container::-webkit-scrollbar {
                    width: 6px;
                }
                .pcc-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .pcc-container::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 3px;
                }
                .pcc-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.5);
                }
                .pcc-container::-webkit-scrollbar-horizontal {
                    display: none;
                }
            `;
            document.head.appendChild(scrollbarStyle);
            container.className = "pcc-container";
            
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
            }, 1500);
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
        const addButton = document.querySelector(".tapestry-react-reset.tapestry-react-services-1kye4lg");
        if (!addButton) {
            console.log("Add button not found");
            performCleanup();
            return;
        }

        // For tracking progress
        let earliestDateFound = null;
        
        // Create loading observer
        const loadingObserver = new MutationObserver((mutations, observer) => {
            // Check if loading indicator exists
            const isLoading = !!document.querySelector(".tapestry-react-reset.tapestry-react-services-urpdis");
            if (!isLoading) {
                // Loading completed, continue with the next step
                continueLoading();
            }
        });
        
        // Start observing the document body for the loading indicator
        loadingObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        // Recursive function to continue loading services until target date
        const continueLoading = () => {
            if (!controller.isActive) {
                console.log("Loading stopped by user.");
                ui.show("Loading stopped", "error");
                loadingObserver.disconnect();
                performCleanup();
                return;
            }

            // Find date element
            const dateElement = document.querySelector(".tapestry-react-services-1yy5xt");
            if (dateElement) {
                // Extract date from element - formats can be:
                // "Jul 6 - Aug 10" (same year)
                // "Jul 14, 2024 - Aug 10, 2025" (different years)
                const dateText = dateElement.innerText;
                console.log("Date element text:", dateText);
                
                // Try to match date with year first: "Jul 14, 2024" or "Jul 14, 2024 - Aug 10, 2025"
                let startDateMatch = dateText.match(/^([A-Za-z]+\s+\d+),\s*(\d{4})/);
                let currentDate;
                
                if (startDateMatch) {
                    // Format: "Jul 14, 2024 - Aug 10, 2025"
                    const startDateStr = startDateMatch[1];
                    const year = parseInt(startDateMatch[2], 10);
                    currentDate = new Date(`${startDateStr}, ${year}`);
                } else {
                    // Try to match date without year: "Jul 6 - Aug 10"
                    startDateMatch = dateText.match(/^([A-Za-z]+\s+\d+)/);
                    if (!startDateMatch) {
                        console.log("Could not parse date from:", dateText);
                        loadingObserver.disconnect();
                        performCleanup();
                        return;
                    }
                    
                    const startDateStr = startDateMatch[1];
                    const currentYear = new Date().getFullYear();
                    currentDate = new Date(`${startDateStr}, ${currentYear}`);
                    
                    // If the parsed date is in the future, it's probably from the previous year
                    const now = new Date();
                    if (currentDate > now) {
                        currentDate.setFullYear(currentYear - 1);
                    }
                }
                
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
                        ui.show("Loading more services...", "loading");
                        // We don't need to call continueLoading here
                        // The observer will call it when loading completes
                    } catch (err) {
                        console.error("Error clicking add button:", err);
                        loadingObserver.disconnect();
                        performCleanup();
                    }
                } else {
                    console.log("Reached target date or within acceptable range:", currentDateStr);
                    controller.isActive = false;
                    loadingObserver.disconnect();
                    ui.updateProgress(100);
                    ui.show("Reached target date or within acceptable range", "success");
                    performCleanup();
                }
            } else {
                console.log("Target date element not found");
                loadingObserver.disconnect();
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