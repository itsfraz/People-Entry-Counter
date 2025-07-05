document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded and DOMContentLoaded event fired.');
    const form = document.getElementById('gateForm');
    const nameInput = document.getElementById('name');
    const vehicleInput = document.getElementById('vehicle');
    const purposeInput = document.getElementById('purpose');
    const purposeOtherInput = document.getElementById('purpose-other');
    const timeInput = document.getElementById('time');
    const searchInput = document.getElementById('search');
    const entriesList = document.getElementById('entries');
    const entryCount = document.getElementById('entry-count');
    const clearEntriesButton = document.getElementById('clear-entries');
    const generateDailyReportTextButton = document.getElementById('generate-daily-report-text');
    const generateDailyReportExcelButton = document.getElementById('generate-daily-report-excel');
    const generateMonthlyReportTextButton = document.getElementById('generate-monthly-report-text');
    const generateMonthlyReportExcelButton = document.getElementById('generate-monthly-report-excel');
    
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const feedback = document.createElement('p');
    feedback.id = 'feedback';
    form.appendChild(feedback);

    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    const fabAddEntry = document.getElementById('fab-add-entry');
    const entryModal = document.getElementById('entry-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let entries = JSON.parse(localStorage.getItem('entries')) || [];
    // Data migration: Convert old date formats to ISO string
    entries = entries.map(entry => {
        if (typeof entry.entryTime === 'string' && !entry.entryTime.endsWith('Z')) {
            // Assuming old format was from toLocaleString(), try to parse and convert
            const date = new Date(entry.entryTime);
            if (!isNaN(date.getTime())) {
                entry.entryTime = date.toISOString();
            }
        }
        return entry;
    });
    localStorage.setItem('entries', JSON.stringify(entries)); // Save migrated data

    let isDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    const entriesPerPage = 2;
    let currentPage = 1;
    let filteredEntries = entries;

    // Initial theme setup
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }

    // Convert name input to uppercase
    nameInput.addEventListener('input', () => {
        nameInput.value = nameInput.value.toUpperCase();
    });

    // Convert vehicle input to uppercase and limit to 10 characters
    vehicleInput.addEventListener('input', () => {
        vehicleInput.value = vehicleInput.value.toUpperCase();
        if (vehicleInput.value.length > 10) {
            vehicleInput.value = vehicleInput.value.slice(0, 10);
            showFeedback('Vehicle number cannot exceed 10 characters.', 'error');
        }
    });

    // Convert purpose input to uppercase
    // purposeInput.addEventListener('input', () => {
    //     purposeInput.value = purposeInput.value.toUpperCase();
    // });

    // Show/hide 'Other' purpose input
    purposeInput.addEventListener('change', () => {
        if (purposeInput.value === 'Other') {
            purposeOtherInput.style.display = 'block';
            purposeOtherInput.required = true;
        } else {
            purposeOtherInput.style.display = 'none';
            purposeOtherInput.required = false;
            purposeOtherInput.value = '';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const entryTime = new Date(timeInput.value);

        const entry = {
            id: Date.now(),
            name: nameInput.value.trim(),
            vehicle: vehicleInput.value.trim(),
            purpose: purposeInput.value === 'Other'
                ? purposeOtherInput.value.trim().toUpperCase()
                : purposeInput.value,
            entryTime: entryTime.toISOString(),
            exitTime: null
        };
        if (validateEntry(entry)) {
            addEntry(entry);
            form.reset();
            closeModal();
            showFeedback('Entry added successfully!', 'success');
        } else {
            console.log('Validation failed:', entry);
            showFeedback('Please fill in all fields correctly.', 'error');
        }
    });

    entriesList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    if (e.target.classList.contains('edit')) {
        editEntry(li);
    } else if (e.target.classList.contains('delete')) {
        deleteEntry(li);
    } else if (e.target.classList.contains('exit')) {
        markAsExited(li);
    }
});

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        filteredEntries = entries.filter(entry =>
            entry.name.toLowerCase().includes(query) ||
            entry.vehicle.toLowerCase().includes(query) ||
            entry.entryTime.includes(query)
        );
        currentPage = 1;
        updateEntries();
    });

    clearEntriesButton.addEventListener('click', () => {
        entries = [];
        filteredEntries = entries;
        updateEntries();
        showFeedback('All entries cleared!', 'success');
    });

    generateDailyReportTextButton.addEventListener('click', generateDailyReportText);
    generateDailyReportExcelButton.addEventListener('click', generateDailyReportExcel);
    generateMonthlyReportTextButton.addEventListener('click', generateMonthlyReportText);
    generateMonthlyReportExcelButton.addEventListener('click', generateMonthlyReportExcel);

    function generateDailyReportText() {
        console.log('generateDailyReportText called.');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today

        const dailyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            entryDate.setHours(0, 0, 0, 0); // Set to start of entry day
            return entryDate.getTime() === today.getTime();
        });
    
        console.log('Daily entries found:', dailyEntries);
        if (dailyEntries.length === 0) {
            showFeedback('No entries found for today.', 'error');
            return;
        }
    
        const reportEntries = dailyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));
    
        const reportContent = reportEntries.map(entry =>
            `${entry.serialNo} - ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime}`
        ).join("\n");
    
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        const todayFormatted = today.toISOString().slice(0, 10);
        downloadLink.download = `daily_report_${todayFormatted}.txt`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    
        showFeedback('Daily report generated successfully!', 'success');
    }

    function generateDailyReportExcel() {
        console.log('generateDailyReportExcel called.');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today

        const dailyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            entryDate.setHours(0, 0, 0, 0); // Set to start of entry day
            return entryDate.getTime() === today.getTime();
        });

        console.log('Daily entries found for Excel:', dailyEntries);
        if (dailyEntries.length === 0) {
            showFeedback('No entries found for today.', 'error');
            return;
        }

        const reportEntries = dailyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));

        const worksheet = XLSX.utils.json_to_sheet(reportEntries);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");
        const todayFormatted = today.toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `daily_report_${todayFormatted}.xlsx`);
        showFeedback('Daily report generated successfully!', 'success');
    }

    function generateMonthlyReportText() {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);
    
        const monthlyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            const entryMonth = entryDate.getMonth() + 1; // getMonth() returns 0-11
            const entryYear = entryDate.getFullYear();
            return entryMonth === selectedMonth && entryYear === selectedYear;
        });
    
        if (monthlyEntries.length === 0) {
            showFeedback('No entries found for the selected month.', 'error');
            return;
        }
    
        const reportEntries = monthlyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));
    
        const reportContent = reportEntries.map(entry =>
            `${entry.serialNo} - ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime}`
        ).join("\n");
    
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `monthly_report_${selectedMonth}_${selectedYear}.txt`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    
        showFeedback('Monthly report generated successfully!', 'success');
    }
    function generateMonthlyReportExcel() {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const selectedMonth = parseInt(monthSelect.value);
        const selectedYear = parseInt(yearSelect.value);
    
        const monthlyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            const entryMonth = entryDate.getMonth() + 1; // getMonth() returns 0-11
            const entryYear = entryDate.getFullYear();
            return entryMonth === selectedMonth && entryYear === selectedYear;
        });
    
        if (monthlyEntries.length === 0) {
            showFeedback('No entries found for the selected month.', 'error');
            return;
        }
    
        const reportEntries = monthlyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));
    
        const worksheet = XLSX.utils.json_to_sheet(reportEntries);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
        XLSX.writeFile(workbook, `monthly_report_${selectedMonth}_${selectedYear}.xlsx`);
    
        showFeedback('Monthly report generated successfully!', 'success');
    }
    

    darkModeToggle.addEventListener('change', () => {
        isDarkMode = darkModeToggle.checked;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', JSON.stringify(true));
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', JSON.stringify(false));
        }
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateEntries();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPage < Math.ceil(filteredEntries.length / entriesPerPage)) {
            currentPage++;
            updateEntries();
        }
    });

    fabAddEntry.addEventListener('click', () => {
        entryModal.classList.add('visible');
    });

    modalCloseBtn.addEventListener('click', () => {
        closeModal();
    });

    entryModal.addEventListener('click', (e) => {
        if (e.target === entryModal) {
            closeModal();
        }
    });

    function closeModal() {
        entryModal.classList.remove('visible');
    }

    function validateEntry(entry) {
        const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
        const isValid = entry.name && vehicleRegex.test(entry.vehicle) && entry.purpose && entry.entryTime;
        console.log('Validation result:', isValid, entry);
        return isValid;
    }

    function addEntry(entry) {
        entries.push(entry);
        filteredEntries = entries;
        updateEntries();
    }

    function editEntry(li) {
        const entry = entries.find(entry => entry.id === parseInt(li.dataset.id));
        if (entry) {
            nameInput.value = entry.name;
            vehicleInput.value = entry.vehicle;
            purposeInput.value = entry.purpose;
            timeInput.value = entry.entryTime.slice(0, 16);
            deleteEntry(li);
            entryModal.classList.add('visible');
            showFeedback('Entry ready to edit.', 'info');
        }
    }

    function deleteEntry(li) {
        entries = entries.filter(entry => entry.id !== parseInt(li.dataset.id));
        filteredEntries = entries;
        updateEntries();
        showFeedback('Entry deleted successfully!', 'success');
    }

    function markAsExited(li) {
        const entry = entries.find(entry => entry.id === parseInt(li.dataset.id));
        if (entry && !entry.exitTime) {
            entry.exitTime = new Date().toLocaleString(); // Set the current time as the exit time
            updateEntries(); // Update the entries list to reflect the change
            showFeedback('Entry marked as exited!', 'success');
        }
    }

    function updateEntries() {
        entriesList.innerHTML = '';
        // Show latest entries first
        const orderedEntries = [...filteredEntries].reverse();
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const paginatedEntries = orderedEntries.slice(start, end);

        paginatedEntries.forEach((entry, index) => {
            const li = document.createElement('li');
            li.dataset.id = entry.id;
            li.innerHTML = `
              <span class="entry-info">
                ${start + index + 1}. ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime ? entry.exitTime : 'Not exited'}
              </span>
              <span class="entry-actions">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
                <button class="exit" ${entry.exitTime ? 'disabled' : ''}>Exit</button>
              </span>
            `;
            li.classList.add('visible');
            entriesList.appendChild(li);
        });

        entryCount.textContent = filteredEntries.length;
        pageInfo.textContent = `Page ${currentPage}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === Math.ceil(filteredEntries.length / entriesPerPage);
        localStorage.setItem('entries', JSON.stringify(entries));
        renderVisitorChart(filteredEntries);
        renderFrequencyChart(filteredEntries);
    }

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = type;
        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = '';
        }, 3000);
    }

    updateEntries();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('section, #entries li').forEach(el => observer.observe(el));

    function renderVisitorChart(entries) {
        const ctx = document.getElementById('visitorChart').getContext('2d');
        // Group by date
        const dateCounts = {};
        entries.forEach(e => {
            const date = new Date(e.entryTime).toLocaleDateString();
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        const labels = Object.keys(dateCounts);
        const data = Object.values(dateCounts);

        if (window.visitorChartInstance) window.visitorChartInstance.destroy();
        window.visitorChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Entries per Day',
                    data,
                    backgroundColor: '#6366f1'
                }]
            }
        });
    }

    function renderFrequencyChart(entries) {
        const freq = {};
        entries.forEach(e => {
            if (e.visitors) {
                e.visitors.forEach(v => {
                    freq[v.name] = (freq[v.name] || 0) + 1;
                });
            }
        });
        const labels = Object.keys(freq);
        const data = Object.values(freq);

        if (window.freqChartInstance) window.freqChartInstance.destroy();
        window.freqChartInstance = new Chart(document.getElementById('freqChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: 'Visitor Frequency',
                    data,
                    backgroundColor: ['#6366f1', '#818cf8', '#f59e42', '#10b981', '#ef4444']
                }]
            }
        });
    }

    // Call this after loading/filtering entries:
    renderVisitorChart(filteredEntries);
    renderFrequencyChart(filteredEntries);

    document.getElementById('filter-report').addEventListener('click', () => {
        const from = document.getElementById('report-from').value;
        const to = document.getElementById('report-to').value;
        let filtered = entries;
        if (from) filtered = filtered.filter(e => new Date(e.entryTime) >= new Date(from));
        if (to) filtered = filtered.filter(e => new Date(e.entryTime) <= new Date(to + 'T23:59:59'));
        renderVisitorChart(filtered);
        renderFrequencyChart(filtered);
        // You can also update table/list here
    });

    document.getElementById('export-pdf').addEventListener('click', () => {
        console.log('Export PDF button clicked.');
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showFeedback('Error: PDF library not loaded. Check internet connection.', 'error');
            console.error('jsPDF library not found on window object.', window.jspdf);
            return;
        }
        console.log('jsPDF library loaded.');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        console.log('Today (start of day):', today.toISOString());

        const dailyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            entryDate.setHours(0, 0, 0, 0); // Set to start of entry day
            console.log(`Comparing entry date ${entryDate.toISOString()} with today ${today.toISOString()}`);
            return entryDate.getTime() === today.getTime();
        });

        console.log('Filtered daily entries for PDF:', dailyEntries);
        if (dailyEntries.length === 0) {
            showFeedback('No entries found for today.', 'error');
            return;
        }

        doc.text('Gate Entry Report - Daily', 10, 10);
        let y = 20;
        dailyEntries.forEach(e => {
            const text = `${e.entryTime} - ${e.name} - ${e.vehicle} - ${e.purpose}`;
            doc.text(text, 10, y);
            y += 10;
            if (y > 270) {
                doc.addPage();
                y = 10;
            }
        });
        const todayFormatted = today.toISOString().slice(0, 10);
        doc.save(`GateEntryReport-Daily-${todayFormatted}.pdf`);
        console.log('PDF generation and save initiated.');
    });

    document.getElementById('email-report').addEventListener('click', () => {
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');
        const selectedMonth = parseInt(monthSelect.value); // 1-12
        const selectedYear = parseInt(yearSelect.value);

        const monthlyEntries = entries.filter(entry => {
            const entryDate = new Date(entry.entryTime);
            // getMonth() returns 0-11, so add 1 for comparison with selectedMonth
            return (entryDate.getMonth() + 1) === selectedMonth && entryDate.getFullYear() === selectedYear;
        });

        if (monthlyEntries.length === 0) {
            showFeedback('No entries found for the selected month to email.', 'error');
            return;
        }

        let body = `Gate Entry Report - ${monthSelect.options[monthSelect.selectedIndex].text} ${selectedYear}:%0D%0A`;
        monthlyEntries.forEach(e => {
            body += `${new Date(e.entryTime).toLocaleString()} - ${e.name} - ${e.vehicle} - ${e.purpose}%0D%0A`;
        });
        window.location.href = `mailto:farajm624@gmail.com=Monthly Gate Entry Report&body=${body}`;
    });
});