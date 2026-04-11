const subjectNames = {
    maths_score: "Mathematics", english_score: "English Language", physics_score: "Physics",
    chem_score: "Chemistry", bio_score: "Biology", fmath_score: "Further Mathematics",
    civic_score: "Civic Education", govt_score: "Government", econs_score: "Economics",
    markt_score: "Marketing", dp_score: "Data Processing", comme_score: "Commerce",
    agric_score: "Agricultural Science", crs_score: "C.R.S", finacc_score: "Financial Accounting",
    litineng_score: "Literature in English", philo_score: "Philosophy", geo_score: "Geography",
    basic_science_score: "Basic Science", basic_tech_score: "Basic Technology",
    bus_stud_score: "Business Studies", cmp_score: "Computer Studies", phe_score: "P.H.E",
    cca_score: "C.C.A", social_stud_score: "Social Studies", home_econs_score: "Home Economics",
    yoruba_score: "Yoruba", french_score: "French", sec_edu_score: "Security Education",
    lit_score: "Literature", music_score: "Music"
};

// Functions must be attached to window so the HTML can see them
window.toggleDept = function() {
    const cls = document.getElementById('classSelect').value;
    document.getElementById('deptDiv').style.display = cls.includes("SSS") ? "block" : "none";
};

window.getGrade = function(score) {
    if (score >= 75) return "A1"; if (score >= 70) return "B2"; if (score >= 65) return "B3";
    if (score >= 60) return "C4"; if (score >= 55) return "C5"; if (score >= 50) return "C6";
    if (score >= 45) return "D7"; if (score >= 40) return "E8"; return "F9";
};

window.isStudentPaid = false;

// Security logic
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') location.reload(); 
});

window.addEventListener('blur', () => {
    if (!window.isStudentPaid) document.getElementById('pdfArea').classList.add('blurred');
});

window.addEventListener('focus', () => {
    document.getElementById('pdfArea').classList.remove('blurred');
});

window.downloadPDF = async function() {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('pdfArea');
    const studentName = document.getElementById('dispName').innerText || "Student";
    const btn = document.querySelector('.download-btn');
    
    btn.innerText = "⌛ Generating...";
    btn.style.opacity = "0.7";

    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${studentName}_Result.pdf`);
    } catch (error) {
        alert("Failed to generate PDF.");
    } finally {
        btn.innerText = "📥 Download Result PDF";
        btn.style.opacity = "1";
    }
};

window.check = async function() {
    const sid = document.getElementById('sid').value;
    const yr = document.getElementById('yearSelect').value;
    const cls = document.getElementById('classSelect').value;
    const dept = document.getElementById('deptSelect').value;
    const pin = document.getElementById('pin').value;
    const msg = document.getElementById('msg');
    const btn = document.getElementById('checkBtn');

    if(!sid || !yr || !cls || !pin || (cls.includes("SSS") && !dept)) { 
        msg.style.color = "#d97706"; msg.innerText = "⚠️ Please fill all fields"; return; 
    }

    btn.classList.add('loading');
    msg.style.color = "#004a99";
    msg.innerText = "⏳ Connecting to Go-Tegs Database...";

    try {
        const res = await fetch(`/api/verify?student_id=${sid}&year=${yr}&class=${cls}&dept=${dept}&pin=${pin}`);
        const data = await res.json();

        if (res.status !== 200) {
            btn.classList.remove('loading');
            msg.style.color = "red"; msg.innerText = "❌ " + (data.error || "Login Failed");
        } else {
            window.isStudentPaid = data.is_paid;
            document.querySelector('.unofficial-overlay').style.display = data.is_paid ? 'none' : 'block';
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('resultSection').style.display = 'block';
            
            document.getElementById('dispTerm').innerText = `${yr} ${data.term || "Examination"}`;
            document.getElementById('dispName').innerText = data.full_name;
            document.getElementById('dispId').innerText = sid;
            document.getElementById('dispDob').innerText = data.dob || "---";
            document.getElementById('dispClass').innerText = cls + (dept ? ` (${dept})` : "");

            let rows = ""; let total = 0;
            data.scores.forEach(s => {
                total += s.score;
                const cleanName = subjectNames[s.subject] || s.subject;
                rows += `<tr><td>${cleanName}</td><td style="text-align:center;">${s.score}</td><td style="text-align:center; font-weight:bold;">${window.getGrade(s.score)}</td></tr>`;
            });
            
            const mean = (total / data.scores.length).toFixed(2);
            document.getElementById('resBody').innerHTML = rows;
            document.getElementById('resTotal').innerText = total;
            document.getElementById('resMean').innerText = mean + "%";
            document.getElementById('resGrade').innerText = window.getGrade(mean);
            document.getElementById('dispTime').innerText = "Generated: " + new Date().toLocaleString();
            msg.innerText = "✅ Success";
        }
    } catch (e) { 
        btn.classList.remove('loading');
        msg.innerText = "❌ Connection Error."; 
    }
};
