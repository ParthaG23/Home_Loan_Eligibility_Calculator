// Get all form elements
        const formElements = {
            employmentType: document.getElementById('employmentType'),
            monthlyIncome: document.getElementById('monthlyIncome'),
            additionalIncome: document.getElementById('additionalIncome'),
            monthlyExpenses: document.getElementById('monthlyExpenses'),
            existingEmis: document.getElementById('existingEmis'),
            applicantAge: document.getElementById('applicantAge'),
            interestRate: document.getElementById('interestRate'),
            loanTenure: document.getElementById('loanTenure')
        };

        // Get result elements
        const resultElements = {
            eligibleAmount: document.getElementById('eligibleAmount'),
            maxEmi: document.getElementById('maxEmi'),
            foirRatio: document.getElementById('foirRatio'),
            totalIncome: document.getElementById('totalIncome'),
            totalObligations: document.getElementById('totalObligations'),
            disposableIncome: document.getElementById('disposableIncome'),
            eligibilityStatus: document.getElementById('eligibilityStatus')
        };

        // Format currency in Indian format
        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(amount);
        }

        // Calculate EMI using formula
        function calculateEMI(principal, rate, tenure) {
            const monthlyRate = rate / (12 * 100);
            const numPayments = tenure * 12;
            
            if (monthlyRate === 0) {
                return principal / numPayments;
            }
            
            return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                   (Math.pow(1 + monthlyRate, numPayments) - 1);
        }

        // Main calculation function
        function calculateLoanEligibility() {
            // Get input values
            const employmentType = formElements.employmentType.value;
            const monthlyIncome = parseFloat(formElements.monthlyIncome.value) || 0;
            const additionalIncome = parseFloat(formElements.additionalIncome.value) || 0;
            const monthlyExpenses = parseFloat(formElements.monthlyExpenses.value) || 0;
            const existingEmis = parseFloat(formElements.existingEmis.value) || 0;
            const applicantAge = parseInt(formElements.applicantAge.value) || 25;
            const interestRate = parseFloat(formElements.interestRate.value) || 8.5;
            const loanTenure = parseInt(formElements.loanTenure.value) || 20;

            // Calculate totals
            const totalIncome = monthlyIncome + additionalIncome;
            const totalObligations = monthlyExpenses + existingEmis;
            const disposableIncome = totalIncome - totalObligations;

            // FOIR (Fixed Obligation to Income Ratio) limits
            let foirLimit = 0.50; // Default for salaried
            if (employmentType === 'self-employed') {
                foirLimit = 0.45;
            } else if (employmentType === 'business') {
                foirLimit = 0.40;
            }

            // Calculate maximum EMI based on FOIR
            const maxEmiBasedOnFOIR = (totalIncome * foirLimit) - existingEmis;
            const maxAffordableEmi = Math.max(0, Math.min(maxEmiBasedOnFOIR, disposableIncome * 0.7));

            // Age factor - reduce tenure if needed
            const retirementAge = 60;
            const maxAllowedTenure = Math.min(loanTenure, retirementAge - applicantAge);
            const adjustedTenure = Math.max(5, maxAllowedTenure);

            // Calculate eligible loan amount
            let eligibleLoanAmount = 0;
            if (maxAffordableEmi > 0 && interestRate > 0) {
                const monthlyRate = interestRate / (12 * 100);
                const numPayments = adjustedTenure * 12;
                
                if (monthlyRate > 0) {
                    eligibleLoanAmount = maxAffordableEmi * 
                        ((Math.pow(1 + monthlyRate, numPayments) - 1) / 
                         (monthlyRate * Math.pow(1 + monthlyRate, numPayments)));
                } else {
                    eligibleLoanAmount = maxAffordableEmi * numPayments;
                }
            }

            // Calculate actual FOIR
            const actualFOIR = totalIncome > 0 ? ((maxAffordableEmi + existingEmis) / totalIncome) * 100 : 0;

            // Determine eligibility status
            let eligibilityStatus = 'Poor';
            let statusClass = 'status-warning';
            
            if (eligibleLoanAmount > 1000000 && actualFOIR <= 45) {
                eligibilityStatus = 'Excellent';
                statusClass = 'status-good';
            } else if (eligibleLoanAmount > 500000 && actualFOIR <= 50) {
                eligibilityStatus = 'Good';
                statusClass = 'status-good';
            } else if (eligibleLoanAmount > 100000) {
                eligibilityStatus = 'Fair';
                statusClass = 'status-warning';
            }

            // Update UI
            resultElements.eligibleAmount.textContent = formatCurrency(eligibleLoanAmount);
            resultElements.maxEmi.textContent = formatCurrency(maxAffordableEmi);
            resultElements.foirRatio.textContent = actualFOIR.toFixed(1) + '%';
            resultElements.totalIncome.textContent = formatCurrency(totalIncome);
            resultElements.totalObligations.textContent = formatCurrency(totalObligations);
            resultElements.disposableIncome.textContent = formatCurrency(disposableIncome);
            resultElements.eligibilityStatus.textContent = eligibilityStatus;
            resultElements.eligibilityStatus.className = statusClass;

            // Update FOIR ratio color
            resultElements.foirRatio.className = actualFOIR <= 50 ? 'mini-value status-good' : 'mini-value status-warning';
        }

        // Add event listeners to all form inputs
        Object.values(formElements).forEach(element => {
            element.addEventListener('input', calculateLoanEligibility);
            element.addEventListener('change', calculateLoanEligibility);
        });

        // Initial calculation with sample data
        window.addEventListener('load', function() {
            formElements.monthlyIncome.value = '75000';
            formElements.monthlyExpenses.value = '25000';
            formElements.applicantAge.value = '32';
            calculateLoanEligibility();
        });

        // Calculate on page load
        calculateLoanEligibility();