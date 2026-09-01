// Scorecard Canvas and PNG Generator Utilities

export interface ExamScorecardParams {
  studentActiveQuestions: any[];
  examQuestions: any[];
  examScore: number;
  studentName: string;
  examConfig: any;
  studentId?: string;
  matricNumber?: string;
  examIdInput?: string;
  examAnswers?: Record<string, any>;
  timeSpent?: number | string;
}

export interface QuizScorecardParams {
  quizScore: number;
  quizQuestions: any[];
  currentUserData?: any;
  quizTopic?: string;
}

const sanitizeCorrectAnswer = (ans: any): string => {
  if (ans === undefined || ans === null) return "";
  return String(ans).trim().toLowerCase();
};

export const generateExamScorecard = (params: ExamScorecardParams) => {
  const { 
    studentActiveQuestions, 
    examQuestions, 
    examScore, 
    studentName, 
    examConfig, 
    studentId, 
    matricNumber = studentId || 'NSG-STUDENT', 
    examIdInput = examConfig?.id || 'CBT-EXAM', 
    examAnswers = {} 
  } = params;
  
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeQuestionsPool = studentActiveQuestions.length > 0 ? studentActiveQuestions : examQuestions;
    const percentage = Math.round((examScore / (activeQuestionsPool.length || 1)) * 100);

    // Dynamic accent color based on score
    let accentColor = '#10B981'; // Emerald
    let accentGlow = 'rgba(16, 185, 129, 0.15)';
    let grade = 'F';
    
    if (percentage >= 90) {
      accentColor = '#10B981';
      grade = 'A+';
    } else if (percentage >= 80) {
      accentColor = '#10B981';
      grade = 'A';
    } else if (percentage >= 60) {
      accentColor = '#F59E0B'; // Amber
      accentGlow = 'rgba(245, 158, 11, 0.15)';
      grade = 'B';
    } else if (percentage >= 40) {
      accentColor = '#3B82F6'; // Blue
      accentGlow = 'rgba(59, 130, 246, 0.15)';
      grade = 'C';
    } else {
      accentColor = '#EF4444'; // Red
      accentGlow = 'rgba(239, 68, 68, 0.15)';
      grade = 'F';
    }

    // 1. Draw premium background
    ctx.fillStyle = '#060B15';
    ctx.fillRect(0, 0, 1000, 750);

    // Overlapping glowing light spots
    const lightGlow = ctx.createRadialGradient(200, 200, 10, 200, 200, 400);
    lightGlow.addColorStop(0, accentGlow);
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, 1000, 750);

    const lightGlowRight = ctx.createRadialGradient(800, 550, 10, 800, 550, 400);
    lightGlowRight.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
    lightGlowRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlowRight;
    ctx.fillRect(0, 0, 1000, 750);

    // Faint Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 750);
      ctx.stroke();
    }
    for (let y = 0; y < 750; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1000, y);
      ctx.stroke();
    }

    // Watermark
    ctx.save();
    ctx.translate(500, 375);
    ctx.rotate(-Math.PI / 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NSG ACADEMIC STUDY GUIDE', 0, 0);
    ctx.restore();

    // 2. Premium Dual Border and Corner Ornaments
    // Gold Outer border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 960, 710);

    // Accent Inner border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 944, 694);

    // Corner L-shapes for premium technical look
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    const corners = [
      { x: 15, y: 15, dx: 30, dy: 30 },
      { x: 985, y: 15, dx: -30, dy: 30 },
      { x: 15, y: 735, dx: 30, dy: -30 },
      { x: 985, y: 735, dx: -30, dy: -30 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + c.dy);
      ctx.stroke();
    });

    // 3. Header & Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('VERIFIED EXAMINATION CREDENTIAL', 500, 60);

    // Main header with linear gradient
    const headerGradient = ctx.createLinearGradient(300, 0, 700, 0);
    headerGradient.addColorStop(0, '#FFFFFF');
    headerGradient.addColorStop(0.5, '#F8FAFC');
    headerGradient.addColorStop(1, '#94A3B8');
    ctx.fillStyle = headerGradient;
    ctx.font = '900 34px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('CBT ACADEMIC SCORECARD', 500, 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'medium 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('OFFICIAL DIGITAL STUDY RECORD & SCORE VERIFICATION', 500, 125);

    // Divider line
    const dividerGrad = ctx.createLinearGradient(150, 0, 850, 0);
    dividerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    dividerGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
    dividerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 145);
    ctx.lineTo(850, 145);
    ctx.stroke();

    // Helper to draw rounded container cards
    const drawCard = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // 4. Candidate Profile Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawCard(100, 175, 450, 180, 16);

    // Vertical Accent strip on left of card
    ctx.fillStyle = accentColor;
    ctx.fillRect(100, 195, 4, 140);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('CERTIFIED STUDENT PROFILE', 125, 205);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(studentName || 'NSG SCHOLAR', 125, 235);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(`MATRIC: ${matricNumber || 'NSG-STUDENT-MOCK'}`, 125, 265);
    ctx.fillText(`EXAM ID: ${examIdInput || 'CBT-MOCK'}`, 125, 290);
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 125, 315);

    // 5. Score Radial Container Card
    drawCard(580, 175, 320, 180, 16);

    // Concentric Ring
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(740, 260, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Actual Radial Score ring
    ctx.beginPath();
    ctx.arc(740, 260, 60, -0.5 * Math.PI, (2 * percentage / 100 - 0.5) * Math.PI);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText(`${percentage}%`, 740, 268);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('ACCURACY', 740, 285);

    // Grade label
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('SCORE RATINGS', 605, 210);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px "Inter", sans-serif';
    ctx.fillText(`GRADE ${grade}`, 605, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText(`${examScore} Correct`, 605, 275);
    ctx.fillText(`${activeQuestionsPool.length - examScore} Missed`, 605, 295);

    // 6. Subjects Breakdown Container
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('CURRICULUM COMPETENCY INDEX', 105, 395);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(100, 408);
    ctx.lineTo(900, 408);
    ctx.stroke();

    const distinctStudentSubjects = (examConfig.subjects && examConfig.subjects.length > 0)
      ? examConfig.subjects.map(s => s.name).filter(name => activeQuestionsPool.some(q => (q.subject || "Mathematics").trim().toLowerCase() === name.trim().toLowerCase()))
      : Array.from(new Set(activeQuestionsPool.map(q => q.subject || "Mathematics").filter(Boolean))) as string[];

    let yPos = 445;
    distinctStudentSubjects.slice(0, 5).forEach((subName) => {
      const subQuestions = activeQuestionsPool.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === subName.trim().toLowerCase());
      let subScore = 0;
      subQuestions.forEach((q) => {
        const studentAns = examAnswers[q.id];
        if (studentAns !== undefined && studentAns !== null && sanitizeCorrectAnswer(studentAns) === sanitizeCorrectAnswer(q.correctAnswer)) {
          subScore++;
        }
      });
      const subPercent = Math.round((subScore / (subQuestions.length || 1)) * 100);

      // Subject container box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(100, yPos - 22, 800, 36);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeRect(100, yPos - 22, 800, 36);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '900 13px "Inter", sans-serif';
      ctx.fillText(subName.toUpperCase(), 120, yPos + 1);

      // Draw background bar track (pill shaped)
      const barX = 380;
      const barY = yPos - 8;
      const barW = 340;
      const barH = 10;
      const barRadius = 5;

      ctx.fillStyle = '#1E293B';
      
      const drawPill = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0, 0.5 * Math.PI);
        ctx.lineTo(x + r, y + h);
        ctx.arc(x + r, y + h - r, r, 0.5 * Math.PI, Math.PI);
        ctx.closePath();
        ctx.fill();
      };
      drawPill(barX, barY, barW, barH, barRadius);

      // Draw active progress bar
      if (subPercent > 0) {
        const fillW = Math.max(10, (subPercent / 100) * barW);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        barGrad.addColorStop(0, accentColor);
        barGrad.addColorStop(1, '#F59E0B');
        ctx.fillStyle = barGrad;
        drawPill(barX, barY, fillW, barH, barRadius);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${subScore}/${subQuestions.length} (${subPercent}%)`, 880, yPos + 1);
      ctx.textAlign = 'left';

      yPos += 48;
    });

    // 7. Digital Stamp / Validation Seal
    const sealX = 820;
    const sealY = 645;
    
    // Outer radial bursts
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 12;
      ctx.beginPath();
      ctx.moveTo(sealX, sealY);
      ctx.lineTo(sealX + Math.cos(angle) * 32, sealY + Math.sin(angle) * 32);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sealX, sealY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.fillText('NSG', sealX, sealY - 3);
    ctx.fillText('SEAL', sealX, sealY + 5);

    // Validation Signature
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillText('ACADEMIC BOARD', 600, 630);
    ctx.fillStyle = '#10B981';
    ctx.font = 'italic 20px "Playfair Display", "Georgia", serif';
    ctx.fillText('Verified', 600, 660);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(600, 670);
    ctx.lineTo(760, 670);
    ctx.stroke();

    // 8. Footer Info
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'italic bold 10px "JetBrains Mono", monospace';
    const completedDateStr = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    ctx.fillText(`COMPLETED ON ${completedDateStr.toUpperCase()}`, 500, 715);

    // Trigger download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_Exam_Scorecard_${studentName ? studentName.replace(/\s+/g, '_') : 'Student'}.png`;
    a.click();
};

export const generateQuizScorecard = (params: QuizScorecardParams) => {
  const { quizScore, quizQuestions, currentUserData, quizTopic } = params;
  
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const percentage = Math.round((quizScore / (quizQuestions.length || 1)) * 100);

    // Dynamic accent color based on score
    let accentColor = '#3B82F6'; // Royal Blue for general study or dynamic accent
    let accentGlow = 'rgba(59, 130, 246, 0.15)';
    let grade = 'F';
    let gradePhrase = 'Requires more practice. Revise materials.';
    
    if (percentage >= 90) {
      accentColor = '#10B981'; // Green
      accentGlow = 'rgba(16, 185, 129, 0.15)';
      grade = 'A+';
      gradePhrase = 'Exceptional knowledge! Outstanding masterclass.';
    } else if (percentage >= 80) {
      accentColor = '#10B981';
      accentGlow = 'rgba(16, 185, 129, 0.15)';
      grade = 'A';
      gradePhrase = 'Magnificent performance! Highly competent.';
    } else if (percentage >= 60) {
      accentColor = '#F59E0B'; // Amber
      accentGlow = 'rgba(245, 158, 11, 0.15)';
      grade = 'B';
      gradePhrase = 'Very good study! Solid passing results.';
    } else if (percentage >= 40) {
      accentColor = '#3B82F6'; // Blue
      grade = 'C';
      gradePhrase = 'Credit Pass. Review incorrect answers.';
    } else {
      accentColor = '#EF4444'; // Red
      accentGlow = 'rgba(239, 68, 68, 0.15)';
      grade = 'F';
      gradePhrase = 'Requires revision. Plan another study cycle.';
    }

    // 1. Draw premium background
    ctx.fillStyle = '#060B15';
    ctx.fillRect(0, 0, 1000, 700);

    // Glowing lights
    const lightGlow = ctx.createRadialGradient(200, 200, 10, 200, 200, 400);
    lightGlow.addColorStop(0, accentGlow);
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, 1000, 700);

    const lightGlowRight = ctx.createRadialGradient(800, 500, 10, 800, 500, 400);
    lightGlowRight.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
    lightGlowRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlowRight;
    ctx.fillRect(0, 0, 1000, 700);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 700);
      ctx.stroke();
    }
    for (let y = 0; y < 700; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1000, y);
      ctx.stroke();
    }

    // Watermark
    ctx.save();
    ctx.translate(500, 350);
    ctx.rotate(-Math.PI / 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NSG SMART STUDY QUIZ', 0, 0);
    ctx.restore();

    // 2. Dual borders & Corner ornaments
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 960, 660);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 944, 644);

    // Corner L-shapes
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    const corners = [
      { x: 15, y: 15, dx: 30, dy: 30 },
      { x: 985, y: 15, dx: -30, dy: 30 },
      { x: 15, y: 685, dx: 30, dy: -30 },
      { x: 985, y: 685, dx: -30, dy: -30 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + c.dy);
      ctx.stroke();
    });

    // 3. Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('STUDY ASSESSMENT VERIFICATION RECORD', 500, 60);

    const headerGradient = ctx.createLinearGradient(300, 0, 700, 0);
    headerGradient.addColorStop(0, '#FFFFFF');
    headerGradient.addColorStop(0.5, '#F8FAFC');
    headerGradient.addColorStop(1, '#94A3B8');
    ctx.fillStyle = headerGradient;
    ctx.font = '900 34px "Inter", sans-serif';
    ctx.fillText('QUIZ PERFORMANCE REPORT', 500, 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'medium 13px "Inter", sans-serif';
    ctx.fillText('STUDENT SELF-ASSESSMENT RECORD & STUDY PROGRESS METRIC', 500, 125);

    // Divider line
    const dividerGrad = ctx.createLinearGradient(150, 0, 850, 0);
    dividerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    dividerGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
    dividerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 145);
    ctx.lineTo(850, 145);
    ctx.stroke();

    const drawCard = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Candidate Info Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawCard(100, 175, 450, 180, 16);

    ctx.fillStyle = accentColor;
    ctx.fillRect(100, 195, 4, 140);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('STUDENT DETAILED PROFILE', 125, 205);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillText(currentUserData?.displayName || currentUserData?.username || 'NSG SCHOLAR', 125, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(`TOPIC: ${(quizTopic || 'General Study').toUpperCase()}`, 125, 280);
    ctx.fillText(`DATE CONCLUDED: ${new Date().toLocaleDateString()}`, 125, 310);

    // Score Radial Container
    drawCard(580, 175, 320, 180, 16);

    // Concentric Ring
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(740, 260, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(740, 260, 60, -0.5 * Math.PI, (2 * percentage / 100 - 0.5) * Math.PI);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText(`${percentage}%`, 740, 268);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('ACCURACY', 740, 285);

    // Grade labels
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('SCORE RATINGS', 605, 210);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px "Inter", sans-serif';
    ctx.fillText(`GRADE ${grade}`, 605, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText(`${quizScore} Correct`, 605, 275);
    ctx.fillText(`${quizQuestions.length - quizScore} Missed`, 605, 295);

    // 5. METRIC METADATA GRID
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('STUDY METRIC METADATA SUMMARY', 105, 395);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(100, 408);
    ctx.lineTo(900, 408);
    ctx.stroke();

    // Three metadata grids (Total, Correct, Incorrect)
    const stats = [
      { label: 'TOTAL ATTEMPTED', val: `${quizQuestions.length} Questions`, color: '#FFFFFF' },
      { label: 'CORRECT ANSWERS', val: `${quizScore} Correct`, color: '#10B981' },
      { label: 'INCORRECT ITEMS', val: `${quizQuestions.length - quizScore} Wrong`, color: '#EF4444' }
    ];

    stats.forEach((stat, i) => {
      const boxX = 100 + i * 275;
      const boxY = 430;
      const boxW = 250;
      const boxH = 75;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      drawCard(boxX, boxY, boxW, boxH, 12);

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '900 9px "Inter", sans-serif';
      ctx.fillText(stat.label, boxX + 18, boxY + 28);

      ctx.fillStyle = stat.color;
      ctx.font = '900 18px "Inter", sans-serif';
      ctx.fillText(stat.val, boxX + 18, boxY + 54);
    });

    // Omni Advisor Box below
    const advY = 530;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.15)';
    drawCard(100, advY, 800, 60, 12);

    ctx.fillStyle = '#D97706';
    ctx.fillRect(100, advY + 12, 4, 36);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('STUDY ADVISOR RECOMMENDATION', 125, advY + 23);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold italic 12px "Inter", sans-serif';
    ctx.fillText(`"${gradePhrase}"`, 125, advY + 43);

    // Validation Signature text / Stamp Seal
    const sealX = 820;
    const sealY = 615;

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 12;
      ctx.beginPath();
      ctx.moveTo(sealX, sealY);
      ctx.lineTo(sealX + Math.cos(angle) * 32, sealY + Math.sin(angle) * 32);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sealX, sealY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.fillText('NSG', sealX, sealY - 3);
    ctx.fillText('SEAL', sealX, sealY + 5);

    // Autograph
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillText('ACADEMIC BOARD', 600, 595);
    ctx.fillStyle = '#10B981';
    ctx.font = 'italic 20px "Playfair Display", "Georgia", serif';
    ctx.fillText('Verified', 600, 622);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(600, 630);
    ctx.lineTo(760, 630);
    ctx.stroke();

    // Footer Info
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'italic bold 10px "JetBrains Mono", monospace';
    const completedDateStr = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    ctx.fillText(`COMPLETED ON ${completedDateStr.toUpperCase()}`, 500, 665);

    // Download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_Quiz_Scorecard_${currentUserData?.username ? currentUserData.username.replace(/\s+/g, '_') : 'Student'}.png`;
    a.click();
};
