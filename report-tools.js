javascript:(function() {
  var d = document,
      iframe = d.getElementById('report-iframe');
  
  if(!iframe) return alert('Report iframe not found!');
  
  var c = iframe.contentDocument || iframe.contentWindow.document,
      f = c.documentElement.outerHTML;
  
  // Remove the iframe and create a container for the report
  iframe.parentNode.removeChild(iframe);
  
  var container = d.createElement('div');
  container.id = 'pco-report-container';
  d.body.appendChild(container);
  container.innerHTML = f;
  
  // Function to inject JavaScript into the container
  function inject(code) {
    var s = d.createElement('script');
    s.textContent = code;
    container.appendChild(s);
  }
  
  // Inject script for sorting and filtering functionality
  inject(`(function() {
    var container = document.getElementById("pco-report-container");
    
    function aggregateAndSortTables() {
      container.querySelectorAll(".sortable-table").forEach(function(table) {
        var tbody = table.querySelector("tbody");
        var rows = Array.from(tbody.querySelectorAll("tr"));
        
        // Group rows by song name
        var songGroups = {};
        
        rows.forEach(function(row) {
          var songName = row.cells[1].textContent.trim();
          if (!songGroups[songName]) {
            songGroups[songName] = [];
          }
          songGroups[songName].push(row);
        });
        
        // Create aggregated rows with multi-row cells
        var aggregatedRows = [];
        
        Object.keys(songGroups).forEach(function(songName) {
          var group = songGroups[songName];
          var count = group.length;
          
          // Create multi-row content for each column while maintaining relationships
          var singerLines = [];
          var dateLines = [];
          var serviceLinkLines = [];
          
          group.forEach(function(row) {
            // Singer column
            singerLines.push(row.cells[0].textContent.trim());
            
            // Date column with links
            var dateCell = row.cells[2];
            var dateText = dateCell.textContent.trim();
            var link = dateCell.querySelector('a');
            if (link) {
              dateLines.push('<a href="' + link.href + '">' + dateText + '</a>');
            } else {
              dateLines.push(dateText);
            }
            
            // Service link column (assuming it's column 4 or later, or extract from existing links)
            var serviceLinkCell = row.cells[4] || row.cells[2]; // fallback to date cell if no 5th column
            var serviceLinkText = '';
            if (serviceLinkCell) {
              var serviceLink = serviceLinkCell.querySelector('a');
              if (serviceLink) {
                serviceLinkText = '<a href="' + serviceLink.href + '">Service Plan</a>';
              } else if (dateCell.querySelector('a')) {
                // Extract service link from date cell link
                var dateLink = dateCell.querySelector('a');
                serviceLinkText = '<a href="' + dateLink.href + '">Service Plan</a>';
              }
            }
            serviceLinkLines.push(serviceLinkText);
          });
          
          // Get the latest date for sorting
          var latestDate = Math.max.apply(Math, group.map(function(row) {
            var dateText = row.cells[2].textContent.trim();
            return new Date(dateText).getTime();
          }));
          
          // Create new aggregated row with nested table structure
          var newRow = document.createElement('tr');
          
          // Create singer cell with nested table
          var singerTableRows = singerLines.map(function(singer) {
            return '<tr><td style="padding: 4px 8px; border-bottom: 1px solid #0000006c; margin: 0;">' + singer + '</td></tr>';
          }).join('');
          var singerTable = '<table style="width: 100%; border-collapse: collapse; margin: 0;"><tbody>' + singerTableRows + '</tbody></table>';
          
          // Create date cell with nested table
          var dateTableRows = dateLines.map(function(date) {
            return '<tr><td style="padding: 4px 8px; border-bottom: 1px solid #0000006c; margin: 0;">' + date + '</td></tr>';
          }).join('');
          var dateTable = '<table style="width: 100%; border-collapse: collapse; margin: 0;"><tbody>' + dateTableRows + '</tbody></table>';
          
          // Create service link cell with nested table
          var serviceLinkTableRows = serviceLinkLines.map(function(serviceLink) {
            return '<tr><td style="padding: 4px 8px; border-bottom: 1px solid #0000006c; margin: 0;">' + serviceLink + '</td></tr>';
          }).join('');
          var serviceLinkTable = '<table style="width: 100%; border-collapse: collapse; margin: 0;"><tbody>' + serviceLinkTableRows + '</tbody></table>';
          
          newRow.innerHTML = 
            '<td style="vertical-align: top; padding: 0;">' + singerTable + '</td>' +
            '<td style="vertical-align: middle; padding: 8px;">' + songName + '</td>' +
            '<td style="vertical-align: top; padding: 0;">' + dateTable + '</td>' +
            '<td style="vertical-align: middle; text-align: center; padding: 8px;">' + count + '</td>' +
            '<td style="vertical-align: top; padding: 0;">' + serviceLinkTable + '</td>';
          
          // Store latest date for sorting
          newRow.dataset.latestDate = latestDate;
          newRow.dataset.count = count;
          
          aggregatedRows.push(newRow);
        });
        
        // Sort aggregated rows by count (descending) then by latest date (descending)
        aggregatedRows.sort(function(a, b) {
          var countA = parseInt(a.dataset.count);
          var countB = parseInt(b.dataset.count);
          
          if (countB !== countA) {
            return countB - countA;
          }
          
          var dateA = parseInt(a.dataset.latestDate) || 0;
          var dateB = parseInt(b.dataset.latestDate) || 0;
          return dateB - dateA;
        });
        
        // Replace tbody content with aggregated rows
        tbody.innerHTML = "";
        aggregatedRows.forEach(function(row) {
          tbody.appendChild(row);
        });
      });
    }
    
    function filterResults() {
      var searchTerm = (container.querySelector("#search").value || "").trim().toLowerCase();
      var dropdownValue = (container.querySelector("#singer-filter").value || "").toLowerCase();
      var totalVisibleSections = 0;

        container.querySelectorAll(".singer-section").forEach(function(section) {
          var singerHeading = section.querySelector("h2"),
              sectionSinger = singerHeading ? singerHeading.textContent.toLowerCase() : "";
          var visibleRows = 0;

          if(!dropdownValue || sectionSinger === dropdownValue) {
            // Always select rows fresh from the DOM
          // Only select top-level rows in the main table, not nested tables
          var rows = section.querySelectorAll(":scope > table > tbody > tr");
          rows.forEach(function(row, idx) {
            // Skip rows with no cells (prevents errors and blanking)
            if (!row.cells || row.cells.length === 0) {
              return;
            }
            var rowText = Array.from(row.cells).map(function(cell) {
              // Use innerText for visible text, including nested tables
              return cell.innerText ? cell.innerText.toLowerCase() : "";
            }).join(" ");

            // If search term is found in any cell, show the row
            if(!searchTerm || rowText.indexOf(searchTerm) !== -1) {
              row.style.display = "";
              visibleRows++;
            } else {
              row.style.display = "none";
            }
          });
          } else {
            section.style.display = "none";
          }

          if(visibleRows > 0 && (!dropdownValue || sectionSinger === dropdownValue)) {
            section.style.display = "block";
            totalVisibleSections++;
          } else {
            section.style.display = "none";
          }
        });

      var noResults = container.querySelector("#no-results");
      if(noResults) {
        noResults.style.display = totalVisibleSections ? "none" : "block";
      }
    }
    
    function debounce(fn, wait) { 
      var timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(fn, wait);
      };
    }
    
    setTimeout(function() {
      aggregateAndSortTables();
      // Debug: log after aggregation
      var firstSection = container.querySelector('.singer-section');
      if (firstSection) {
        var firstRow = firstSection.querySelector('tbody tr');
        if (firstRow) {
          console.log('First row after aggregation:', firstRow.innerHTML);
        }
      }

      // Call filterResults immediately after aggregation to ensure initial state is correct
      filterResults();

      var searchElem = container.querySelector("#search"),
          dropdownElem = container.querySelector("#singer-filter");

      if(searchElem) searchElem.addEventListener("input", debounce(filterResults, 300));
      if(dropdownElem) dropdownElem.addEventListener("change", filterResults);
    }, 100);
  })();`);
})();