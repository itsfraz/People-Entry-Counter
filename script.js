document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gateForm');
    const nameInput = document.getElementById('name');
    const vehicleInput = document.getElementById('vehicle');
    const purposeInput = document.getElementById('purpose');
    const timeInput = document.getElementById('time');
    const searchInput = document.getElementById('search');
    const entriesList = document.getElementById('entries');
    const entryCount = document.getElementById('entry-count');
    const clearEntriesButton = document.getElementById('clear-entries');
    const importEntriesInput = document.getElementById('import-entries');
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

    let entries = JSON.parse(localStorage.getItem('entries')) || [];
    const isDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    const entriesPerPage = 5;
    let currentPage = 1;
    let filteredEntries = entries;

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('header').classList.add('dark-mode');
        document.querySelector('footer').classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    vehicleInput.addEventListener('input', () => {
        vehicleInput.value = vehicleInput.value.toUpperCase();
        if (vehicleInput.value.length > 10) {
            vehicleInput.value = vehicleInput.value.slice(0, 10);
            showFeedback('Vehicle number cannot exceed 10 characters.', 'error');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now(),
            name: nameInput.value.trim(),
            vehicle: vehicleInput.value.trim(),
            purpose: purposeInput.value.trim(),
            entryTime: timeInput.value,
            exitTime: null
        };
        if (validateEntry(entry)) {
            addEntry(entry);
            form.reset();
            showFeedback('Entry added successfully!', 'success');
        } else {
            console.log('Validation failed:', entry);
            showFeedback('Please fill in all fields correctly.', 'error');
        }
    });

    entriesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit')) {
            editEntry(e.target.parentElement);
        } else if (e.target.classList.contains('delete')) {
            deleteEntry(e.target.parentElement);
        } else if (e.target.classList.contains('exit')) {
            markAsExited(e.target.parentElement);
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

    importEntriesInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedEntries = JSON.parse(event.target.result);
                    if (Array.isArray(importedEntries)) {
                        entries = importedEntries;
                        filteredEntries = entries;
                        updateEntries();
                        showFeedback('Entries imported successfully!', 'success');
                    } else {
                        showFeedback('Invalid file format.', 'error');
                    }
                } catch (error) {
                    showFeedback('Error reading file.', 'error');
                }
            };
            reader.readAsText(file);
        }
    });

    generateDailyReportTextButton.addEventListener('click', () => {
        const today = new Date().toISOString().slice(0, 10);
        const dailyEntries = entries.filter(entry => entry.entryTime.startsWith(today));
        const reportEntries = dailyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));
        const dataStr = "data:text/plain;charset=utf-8," + reportEntries.map(entry => 
            `${entry.serialNo} - ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime}`
        ).join("\n");
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "daily_report.txt");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showFeedback('Daily report generated successfully!', 'success');
    });

    generateDailyReportExcelButton.addEventListener('click', () => {
        const today = new Date().toISOString().slice(0, 10);
        const dailyEntries = entries.filter(entry => entry.entryTime.startsWith(today));
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
        XLSX.writeFile(workbook, "daily_report.xlsx");
        showFeedback('Daily report generated successfully!', 'success');
    });

    generateMonthlyReportTextButton.addEventListener('click', () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyEntries = entries.filter(entry => entry.entryTime.startsWith(currentMonth));
        const reportEntries = monthlyEntries.map((entry, index) => ({
            serialNo: index + 1,
            name: entry.name,
            vehicle: entry.vehicle,
            purpose: entry.purpose,
            entryTime: entry.entryTime,
            exitTime: entry.exitTime || 'Not exited'
        }));
        const dataStr = "data:text/plain;charset=utf-8," + reportEntries.map(entry => 
            `${entry.serialNo} - ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime}`
        ).join("\n");
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "monthly_report.txt");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showFeedback('Monthly report generated successfully!', 'success');
    });

    generateMonthlyReportExcelButton.addEventListener('click', () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyEntries = entries.filter(entry => entry.entryTime.startsWith(currentMonth));
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
        XLSX.writeFile(workbook, "monthly_report.xlsx");
        showFeedback('Monthly report generated successfully!', 'success');
    });

    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        document.querySelector('header').classList.toggle('dark-mode');
        document.querySelector('footer').classList.toggle('dark-mode');
        localStorage.setItem('darkMode', JSON.stringify(darkModeToggle.checked));
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
        nameInput.value = entry.name;
        vehicleInput.value = entry.vehicle;
        purposeInput.value = entry.purpose;
        timeInput.value = entry.entryTime;
        deleteEntry(li);
        showFeedback('Entry ready to edit.', 'info');
    }

    function deleteEntry(li) {
        entries = entries.filter(entry => entry.id !== parseInt(li.dataset.id));
        filteredEntries = entries;
        updateEntries();
        showFeedback('Entry deleted successfully!', 'success');
    }

    function markAsExited(li) {
        const entry = entries.find(entry => entry.id === parseInt(li.dataset.id));
        entry.exitTime = new Date().toLocaleString();
        updateEntries();
        showFeedback('Entry marked as exited!', 'success');
    }

    function updateEntries() {
        entriesList.innerHTML = '';
        const start = (currentPage - 1) * entriesPerPage;
        const end = start + entriesPerPage;
        const paginatedEntries = filteredEntries.slice(start, end);

        paginatedEntries.forEach((entry, index) => {
            const li = document.createElement('li');
            li.dataset.id = entry.id;
            li.innerHTML = `
                ${start + index + 1}. ${entry.name} - ${entry.vehicle} - ${entry.purpose} - ${entry.entryTime} - ${entry.exitTime ? entry.exitTime : 'Not exited'}
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
                <button class="exit" ${entry.exitTime ? 'disabled' : ''}>Exit</button>
            `;
            entriesList.appendChild(li);
        });

        entryCount.textContent = filteredEntries.length;
        pageInfo.textContent = `Page ${currentPage}`;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === Math.ceil(filteredEntries.length / entriesPerPage);
        localStorage.setItem('entries', JSON.stringify(entries));
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
});
