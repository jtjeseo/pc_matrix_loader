# PC Matrix Loader

A browser bookmarklet tool that automates the loading of historical service data in Planning Center Matrix.

## Overview

This utility helps Planning Center users quickly load historical service data by automating the "Load More" button clicks. Instead of repeatedly clicking to retrieve past services, this bookmarklet will continue loading until it reaches your target date.

## Features

- 🚀 **Fast Data Loading** - Automatically clicks the "Load More" button until reaching the target date
- 📅 **Customizable Time Range** - Choose how many months of historical data to load (up to 36 months)
- 📊 **Visual Progress** - Real-time progress bar shows loading status
- 🛑 **Stop Anytime** - Cancel the loading process whenever needed
- 💾 **Remembers Settings** - Stores your preferred time range for future use
- 🎨 **Modern UI** - Clean, responsive interface with status notifications
- ⚡ **Optimized Performance** - Uses MutationObserver for efficient loading detection

## Usage

### Installation

1. Create a new bookmark in your browser
2. Name it "PC Matrix Loader" (or any name you prefer)
3. Copy the entire contents of `bookmarklet-minify.js` into the URL/location field
4. Save the bookmark

### Running the Tool

1. Navigate to your Planning Center Services page
2. Click the "PC Matrix Loader" bookmark in your browser
3. In the configuration dialog, enter how many months back you want to load
4. Click "Start Loading" to begin
5. The tool will automatically load services until reaching your target date
6. Use the "Stop Loading" button if you need to cancel

## Technical Details

This tool is built as a self-contained JavaScript bookmarklet with no external dependencies. It works by:

1. Injecting custom CSS for the user interface
2. Calculating the target date based on user input
3. Finding and automating clicks on the "Load More" button
4. Using MutationObserver to efficiently detect when loading operations complete
5. Tracking progress by monitoring loaded date ranges
6. Providing visual feedback through a status interface

The code uses modern JavaScript features including:
- MutationObserver API for real-time DOM change detection
- Promises for asynchronous operations
- ES6 classes for better organization
- Modern CSS with animations and transitions

## Development

### Project Structure

- `bookmarklet.js` - The unminified source code with full formatting and comments
- `bookmarklet-minify.js` - The minified version for use as a browser bookmarklet

### Building

To rebuild the minified version:

1. Edit `bookmarklet.js` as needed.
2. Run the `build-bookmarklet.js` script to generate the minified file. For example:
   ```bash
   node build-bookmarklet.js
   ```
3. The minified file will be created as `bookmarklet-minify.js` in the project directory.
4. Ensure the minified code is properly URI-encoded if needed for the bookmarklet.

## Performance Improvements

The latest version implements the MutationObserver API to replace the previous setTimeout-based approach. This provides:
- More accurate detection of when loading operations complete
- Faster response to DOM changes
- Reduced CPU usage with event-based monitoring instead of polling
- Better reliability across different network conditions

## Compatibility

- ✓ Google Chrome
- ✓ Microsoft Edge
- ✓ Firefox
- ✓ Safari

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
