// Fallback Quiz Generation Utilities

export interface FallbackQuizParams {
  topicName: string;
  countNum: number;
  quizDocuments?: any[];
  importedQuizNote?: any;
}

export const buildFallbackQuizQuestions = (
  topicName: string, 
  countNum: number,
  quizDocuments?: any[],
  importedQuizNote?: any
) => {
  
    const rawTopic = topicName.trim() || "General Knowledge";
    const numQuestions = Math.max(1, countNum || 5);
    const lowerTopic = rawTopic.toLowerCase();
    
    // Check if any quiz documents or imported note have extracted text
    let aggregatedDocText = "";
    if (quizDocuments && quizDocuments.length > 0) {
      quizDocuments.forEach(doc => {
        if (doc.extractedText && doc.extractedText.trim().length > 20) {
          aggregatedDocText += doc.extractedText.trim() + "\n\n";
        }
      });
    }
    if (importedQuizNote && importedQuizNote.content && importedQuizNote.content.trim().length > 20) {
      aggregatedDocText += importedQuizNote.content.trim() + "\n\n";
    }

    if (aggregatedDocText.length > 30) {
      const sentences = aggregatedDocText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 25 && !s.toLowerCase().startsWith('http'));

      if (sentences.length >= 2) {
        const qList = [];
        for (let i = 0; i < numQuestions; i++) {
          const sentence = sentences[i % sentences.length];
          const words = sentence.split(/\s+/).filter(w => w.length > 3);
          const keyTerm = words.find(w => w.length > 5) || words[0] || "this topic";
          qList.push({
            question: `Q${i + 1}. In the context of ${keyTerm}, which statement accurately reflects the core principle: "${sentence.slice(0, 110)}..."?`,
            options: [
              `${sentence.slice(0, 95)}`,
              `It contradicts empirical observations established in ${keyTerm}`,
              `This principle applies exclusively to non-standard theoretical edge cases`,
              `It is invalidated by contrary hypotheses in modern analysis`
            ],
            correctAnswer: 0,
            explanation: `Based on fundamental concepts of ${keyTerm}: "${sentence}"`
          });
        }
        return qList;
      }
    }

    // 1. ANATOMY, MEDICAL & BIOLOGICAL DOMAIN
    const isMedicalOrBiology = /\b(anatomy|epiglottitis|physiology|pathology|medical|medicine|biology|cardiology|neurology|histology|biochem|microbiology|pharmacology|disease|respiratory|clinical|skeletal|muscular|organ|body|health)\b/i.test(lowerTopic);

    if (isMedicalOrBiology) {
      const cleanMedSubject = rawTopic
        .replace(/quiz|exam|test|questions?|generate|practice/gi, '')
        .trim() || rawTopic;

      const medQuestionBank = [
        {
          q: `Which anatomical or physiological principle is fundamental when evaluating ${cleanMedSubject}?`,
          opts: [
            `Structural integrity, cellular homeostasis, and organ system coordination`,
            `Complete absence of cellular membrane transport mechanisms`,
            `Static metabolic activity regardless of environmental stimuli`,
            `Random non-regulated tissue differentiation across systemic pathways`
          ],
          ans: 0,
          exp: `In ${cleanMedSubject}, normal physiological function relies on cellular homeostasis, structural integrity, and coordinated tissue responses.`
        },
        {
          q: `In the clinical study of ${cleanMedSubject}, what is the primary diagnostic indicator of tissue or organ involvement?`,
          opts: [
            `Specific morphological changes and characteristic clinical signs`,
            `Invariable reduction of peripheral blood volume`,
            `Complete cessation of enzymatic signaling`,
            `Random mutation without functional manifestation`
          ],
          ans: 0,
          exp: `Clinical evaluation in ${cleanMedSubject} focuses on direct morphological alterations and clinical signs consistent with the affected anatomy.`
        },
        {
          q: `Which primary mechanism regulates functional pathways in ${cleanMedSubject}?`,
          opts: [
            `Feedback inhibition and physiological regulatory loops`,
            `Unchecked positive feedback leading to systemic collapse`,
            `Arbitrary hormonal fluctuations with no receptor binding`,
            `Absence of intracellular enzymatic catalysts`
          ],
          ans: 0,
          exp: `Physiological and anatomical balance in ${cleanMedSubject} is governed by tightly controlled negative feedback mechanisms and receptor-mediated signaling.`
        },
        {
          q: `How do physiological systems adapt to stress or pathological disruption in ${cleanMedSubject}?`,
          opts: [
            `Through compensatory physiological responses and cellular remodeling`,
            `Immediate irreversible cellular necrosis without defense mechanisms`,
            `Passive diffusion breakdown across all epithelial barriers`,
            `Inactivation of all vascular and lymphatic drainage networks`
          ],
          ans: 0,
          exp: `Tissues and organ systems respond to stressors in ${cleanMedSubject} through compensatory adaptations and immune/cellular remodeling.`
        },
        {
          q: `What is the key functional role of epithelial and connective tissues in ${cleanMedSubject}?`,
          opts: [
            `Providing structural support, compartmentalization, and protection`,
            `Serving solely as inert non-reactive physical bulk`,
            `Preventing nutrient absorption and gas exchange`,
            `Eliminating all extracellular matrix interactions`
          ],
          ans: 0,
          exp: `Epithelial and connective frameworks in ${cleanMedSubject} provide critical barrier defense, organ compartmentalization, and structural support.`
        }
      ];

      const qList = [];
      for (let i = 0; i < numQuestions; i++) {
        const item = medQuestionBank[i % medQuestionBank.length];
        qList.push({
          question: `Q${i + 1}. ${item.q}`,
          options: item.opts,
          correctAnswer: item.ans,
          explanation: item.exp
        });
      }
      return qList;
    }

    // 2. STATISTICAL & MATHEMATICAL DOMAIN (STRICT: Only when explicitly math/statistics)
    const isStatisticsOrMath = /\b(calculus|algebra|trigonometry|derivatives?|integrals?|geometry|arithmetic|pure math|statistics exam|math exam|statistical skewness|statistical kurtosis)\b/i.test(lowerTopic) 
      && !isMedicalOrBiology;

    if (isStatisticsOrMath) {
      const mathQuestionBank = [
        {
          q: "Given the dataset: $[4, 8, 12, 12, 16, 20, 24]$, what is the median and mode of this distribution?",
          opts: [
            "Median = 12, Mode = 12",
            "Median = 14, Mode = 12",
            "Median = 12, Mode = 16",
            "Median = 16, Mode = 12"
          ],
          ans: 0,
          exp: "Arranging in ascending order: 4, 8, 12, 12, 16, 20, 24 (n = 7). The middle value (4th element) is 12. The most frequent value is 12."
        },
        {
          q: "A distribution has a mean of 60, a median of 54, and a standard deviation of 8. What is Karl Pearson's coefficient of skewness ($S_k$)?",
          opts: [
            "$S_k = +2.25$",
            "$S_k = +0.75$",
            "$S_k = -2.25$",
            "$S_k = +1.50$"
          ],
          ans: 0,
          exp: "Pearson's Skewness formula is $S_k = \\frac{3(\\text{Mean} - \\text{Median})}{\\sigma} = \\frac{3(60 - 54)}{8} = \\frac{18}{8} = +2.25$ (positively skewed)."
        },
        {
          q: "A standard fair 6-sided die is rolled twice. What is the probability of obtaining a sum equal to 7?",
          opts: [
            "$\\frac{1}{6}$",
            "$\\frac{1}{12}$",
            "$\\frac{7}{36}$",
            "$\\frac{5}{36}$"
          ],
          ans: 0,
          exp: "Total outcomes = $6 \\times 6 = 36$. Favorable pairs summing to 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs. $P(\\text{Sum}=7) = \\frac{6}{36} = \\frac{1}{6}$."
        },
        {
          q: "If the coefficient of kurtosis (excess kurtosis $\\gamma_2 = \\beta_2 - 3$) for a distribution is equal to 0, what is the geometric nature of the peak?",
          opts: [
            "Mesokurtic (identical peak to a Normal distribution)",
            "Leptokurtic (sharper, heavy-tailed peak)",
            "Platykurtic (flatter, light-tailed distribution)",
            "Asymmetric U-shaped distribution"
          ],
          ans: 0,
          exp: "A normal distribution has $\\beta_2 = 3$ and excess kurtosis $\\gamma_2 = 0$, which is termed Mesokurtic."
        },
        {
          q: "For a moderately skewed frequency distribution, which empirical formula accurately models the relationship between Mean, Median, and Mode?",
          opts: [
            "$\\text{Mode} \\approx 3(\\text{Median}) - 2(\\text{Mean})$",
            "$\\text{Mode} \\approx 2(\\text{Median}) - 3(\\text{Mean})$",
            "$\\text{Median} \\approx 3(\\text{Mean}) - \\text{Mode}$",
            "$\\text{Mean} \\approx 3(\\text{Mode}) - 2(\\text{Median})$"
          ],
          ans: 0,
          exp: "The standard empirical approximation for unimodal moderately skewed distributions is: $\\text{Mode} \\approx 3(\\text{Median}) - 2(\\text{Mean})$."
        },
        {
          q: "Calculate the arithmetic mean and variance of the sample values: $[2, 4, 6, 8, 10]$.",
          opts: [
            "Mean = 6, Sample Variance ($s^2$) = 10",
            "Mean = 6, Sample Variance ($s^2$) = 8",
            "Mean = 5, Sample Variance ($s^2$) = 10",
            "Mean = 6, Sample Variance ($s^2$) = 20"
          ],
          ans: 0,
          exp: "Mean = $\\frac{2+4+6+8+10}{5} = 6$. Deviations: $(-4)^2 + (-2)^2 + 0^2 + 2^2 + 4^2 = 16+4+0+4+16 = 40$. Sample variance $s^2 = \\frac{40}{5-1} = 10$."
        },
        {
          q: "In a negatively skewed (left-skewed) distribution, what is the typical ordering of the three measures of central tendency?",
          opts: [
            "$\\text{Mean} < \\text{Median} < \\text{Mode}$",
            "$\\text{Mode} < \\text{Median} < \\text{Mean}$",
            "$\\text{Median} < \\text{Mean} < \\text{Mode}$",
            "$\\text{Mean} = \\text{Median} = \\text{Mode}$"
          ],
          ans: 0,
          exp: "In negatively skewed distributions, extreme small values pull the Mean to the far left, resulting in $\\text{Mean} < \\text{Median} < \\text{Mode}$."
        },
        {
          q: "Two independent events $A$ and $B$ have probabilities $P(A) = 0.4$ and $P(B) = 0.5$. What is $P(A \\cup B)$?",
          opts: [
            "$0.70$",
            "$0.90$",
            "$0.20$",
            "$0.50$"
          ],
          ans: 0,
          exp: "$P(A \\cap B) = P(A) \\times P(B) = 0.4 \\times 0.5 = 0.20$. By the addition rule: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.4 + 0.5 - 0.2 = 0.70$."
        }
      ];

      const qList = [];
      for (let i = 0; i < numQuestions; i++) {
        const item = mathQuestionBank[i % mathQuestionBank.length];
        qList.push({
          question: `Q${i + 1}. ${item.q}`,
          options: item.opts,
          correctAnswer: item.ans,
          explanation: item.exp
        });
      }
      return qList;
    }

    // 2. GENERAL ACADEMIC DOMAINS (Cleanly extract 1-3 core subject terms)
    const cleanSubject = rawTopic
      .replace(/quiz|exam|test|questions?|generate|mathematically|solvable/gi, '')
      .trim() || rawTopic;

    const academicQuestionBank = [
      {
        q: `What is the fundamental mechanism defining "${cleanSubject}"?`,
        opts: [
          `A systematic set of principles and verifiable analytical foundations`,
          `Purely arbitrary subjective speculation without experimental backing`,
          `Static historical definitions inapplicable to contemporary analysis`,
          `Unregulated assumptions lacking reproducible empirical standards`
        ],
        ans: 0,
        exp: `The study of ${cleanSubject} is structured upon systematic principles and verifiable foundational models.`
      },
      {
        q: `Which analytical method is most effective when evaluating core principles of ${cleanSubject}?`,
        opts: [
          `Quantitative and qualitative empirical modeling with baseline controls`,
          `Disregarding variance and rejecting verified benchmarks`,
          `Relying on unverified heuristics without formal proof`,
          `Isolating variables without testing boundary conditions`
        ],
        ans: 0,
        exp: `Rigorous analysis in ${cleanSubject} utilizes empirical modeling, comparative benchmarks, and validated controls.`
      },
      {
        q: `How do practitioners systematically address anomalies in ${cleanSubject}?`,
        opts: [
          `By isolating contributing factors, testing boundary constraints, and refining models`,
          `By immediately discarding baseline data without investigation`,
          `By assuming anomalies represent standard behavior`,
          `By eliminating statistical rigor and relying solely on conjecture`
        ],
        ans: 0,
        exp: `Resolving anomalies in ${cleanSubject} requires isolating variables, examining edge cases, and updating foundational models.`
      },
      {
        q: `What primary metric is evaluated to verify operational success in ${cleanSubject}?`,
        opts: [
          `Consistency, reproducibility, and alignment with theoretical standards`,
          `Random correlation without causal evidence`,
          `Subjective consensus without empirical measurements`,
          `Minimization of experimental controls`
        ],
        ans: 0,
        exp: `Success criteria in ${cleanSubject} depend on verifiable reproducibility, consistency, and structural alignment.`
      },
      {
        q: `When synthesizing complex concepts within ${cleanSubject}, what is the recommended procedure?`,
        opts: [
          `Decompose the problem into core components and analyze interdependencies`,
          `Apply arbitrary assumptions to unmeasured variables`,
          `Ignore foundational relationships between sub-systems`,
          `Rely on isolated single-point observations`
        ],
        ans: 0,
        exp: `Synthesizing concepts in ${cleanSubject} starts with systematic decomposition of variables and evaluating their interactions.`
      }
    ];

    const qList = [];
    for (let i = 0; i < numQuestions; i++) {
      const tmpl = academicQuestionBank[i % academicQuestionBank.length];
      qList.push({
        question: `Q${i + 1}. ${tmpl.q}`,
        options: tmpl.opts,
        correctAnswer: tmpl.ans,
        explanation: tmpl.exp
      });
    }
    return qList;
};
