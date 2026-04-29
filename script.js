document.addEventListener('DOMContentLoaded', () => {
    // Theme logic - mock
    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn.addEventListener('click', () => {
        // Toggle dark mode logic
    });

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const cardsContainer = document.getElementById('cards-container');
    const urlCard = document.getElementById('url-card');
    const emailCard = document.getElementById('email-card');
    const historySection = document.getElementById('history-section');
    const aboutSection = document.getElementById('about-section');

    function switchView(target) {
        // Hide all major sections
        cardsContainer.classList.add('hidden');
        urlCard.classList.add('hidden');
        emailCard.classList.add('hidden');
        historySection.classList.add('hidden');
        aboutSection.classList.add('hidden');

        if (target === 'dashboard') {
            cardsContainer.classList.remove('hidden');
            urlCard.classList.remove('hidden');
            emailCard.classList.remove('hidden');
            historySection.classList.remove('hidden');
        } else if (target === 'url-checker') {
            cardsContainer.classList.remove('hidden');
            urlCard.classList.remove('hidden');
            // make the url card take full width if alone
            cardsContainer.style.gridTemplateColumns = '1fr'; 
        } else if (target === 'email-checker') {
            cardsContainer.classList.remove('hidden');
            emailCard.classList.remove('hidden');
            // make the email card take full width if alone
            cardsContainer.style.gridTemplateColumns = '1fr';
        } else if (target === 'scan-history') {
            historySection.classList.remove('hidden');
        } else if (target === 'about') {
            aboutSection.classList.remove('hidden');
        }

        // Reset grid columns for dashboard view
        if (target === 'dashboard') {
            cardsContainer.style.gridTemplateColumns = '';
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            switchView(target);
        });
    });
    // ------------------------

    // URL Checker Logic
    const checkUrlBtn = document.getElementById('check-url-btn');
    const urlInput = document.getElementById('url-input');
    const urlResult = document.getElementById('url-result');

    checkUrlBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) return;

        checkUrlBtn.innerHTML = '<i class="fa-solid fa-spinner spin"></i> Checking...';
        
        try {
            const response = await fetch('/check-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            const data = await response.json();
            
            renderResult(urlResult, data, 'url');
            fetchHistory();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            checkUrlBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Check URL';
        }
    });

    // Email Checker Logic
    const checkEmailBtn = document.getElementById('check-email-btn');
    const emailInput = document.getElementById('email-input');
    const emailResult = document.getElementById('email-result');

    checkEmailBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) return;

        checkEmailBtn.innerHTML = '<i class="fa-solid fa-spinner spin"></i> Checking...';

        try {
            const response = await fetch('/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const data = await response.json();
            
            renderResult(emailResult, data, 'email');
            fetchHistory();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            checkEmailBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Check Email';
        }
    });

    // Render result box
    function renderResult(container, data, type) {
        container.classList.remove('hidden', 'success', 'danger', 'warning');
        container.className = 'result-box';
        
        let boxClass = '';
        let iconClass = '';
        let colorClass = '';

        if (data.status === 'Safe') {
            boxClass = 'success';
            iconClass = 'fa-solid fa-check-circle';
            colorClass = 'safe';
        } else if (data.status === 'Suspicious') {
            boxClass = 'warning';
            iconClass = 'fa-solid fa-triangle-exclamation';
            colorClass = 'warning-score';
        } else {
            boxClass = 'danger';
            iconClass = 'fa-solid fa-circle-exclamation';
            colorClass = '';
        }

        container.classList.add(boxClass);

        const isSafe = data.status === 'Safe';
        const reasonIcon = isSafe ? 'fa-solid fa-check-circle' : 'fa-solid fa-triangle-exclamation';

        let descText = "";
        if (type === 'url') {
            if (data.status === 'Safe') descText = "This link appears to be safe.";
            else if (data.status === 'Suspicious') descText = "This link has some suspicious elements. Proceed with caution.";
            else descText = "This link is highly suspicious and may be a phishing site.";
        } else {
            if (data.status === 'Safe') descText = "This email appears to be safe.";
            else if (data.status === 'Suspicious') descText = "This email has some suspicious elements. Proceed with caution.";
            else descText = "This email is highly suspicious and may be a phishing attempt.";
        }

        let reasonsHtml = data.reasons.map(r => `<li><i class="${reasonIcon}"></i> ${r}</li>`).join('');

        container.innerHTML = `
            <div class="result-header">
                <div class="result-title">
                    <i class="${iconClass}"></i> Result: ${data.status}
                </div>
                <div class="score-display">
                    Score: <span class="score-value ${colorClass}">${data.score} / 5</span>
                </div>
            </div>
            <p class="result-desc">${descText}</p>
            <div class="reasons-title">Reasons:</div>
            <ul class="reasons-list">
                ${reasonsHtml}
            </ul>
        `;
    }

    // History Logic
    const historyBody = document.getElementById('history-body');

    async function fetchHistory() {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            
            historyBody.innerHTML = '';
            
            data.history.forEach(scan => {
                let resultBadgeClass = '';
                let scoreClass = '';
                if (scan.result === 'Phishing') {
                    resultBadgeClass = 'badge-phishing';
                } else if (scan.result === 'Suspicious') {
                    resultBadgeClass = 'badge-suspicious';
                } else {
                    resultBadgeClass = 'badge-safe';
                    scoreClass = 'safe';
                }

                const typeBadgeClass = scan.type === 'URL' ? 'badge-url' : 'badge-email';

                const date = new Date(scan.timestamp);
                const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge ${typeBadgeClass}">${scan.type}</span></td>
                    <td><div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${scan.input}</div></td>
                    <td><span class="badge ${resultBadgeClass}">${scan.result}</span></td>
                    <td><span class="score-text ${scoreClass}">${scan.score} / 5</span></td>
                    <td class="date-text">${dateStr}, ${timeStr}</td>
                `;
                historyBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }

    fetchHistory();
});
