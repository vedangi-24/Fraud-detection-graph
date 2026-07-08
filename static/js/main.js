document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const exportCsvButton = document.getElementById('exportCsv');
    if (exportCsvButton) {
        exportCsvButton.addEventListener('click', function() {
            window.location.href = '/download/report/transactions';
        });
    }

    const minAmountInput = document.getElementById('minAmount');
    const riskFilter = document.getElementById('riskFilter');
    const tableBody = document.querySelector('.transactions-table tbody');

    function filterTransactions() {
        if (!tableBody) return;

        const minAmount = Number(minAmountInput ? minAmountInput.value : 0);
        const riskLevel = riskFilter ? riskFilter.value : 'all';

        Array.from(tableBody.rows).forEach(row => {
            const amount = Number(row.cells[3].textContent.replace(/[^0-9.]/g, ''));
            const status = row.cells[5].textContent.toLowerCase();
            let show = amount >= minAmount;

            if (show && riskLevel !== 'all') {
                if (riskLevel === 'low') {
                    show = status === 'normal';
                } else if (riskLevel === 'high' || riskLevel === 'critical') {
                    show = status === 'fraud';
                } else if (riskLevel === 'medium') {
                    show = status !== 'fraud';
                }
            }

            row.style.display = show ? '' : 'none';
        });
    }

    if (minAmountInput) {
        minAmountInput.addEventListener('input', filterTransactions);
    }

    if (riskFilter) {
        riskFilter.addEventListener('change', filterTransactions);
    }
});
