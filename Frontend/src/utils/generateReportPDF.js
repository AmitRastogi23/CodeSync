import pdfMake from "./pdfFonts";

export const generateReportPDF = (data) => {
  const { session, notes, violations = [], questions } = data;

  // Violations breakdown logic
  const violationBreakdown = {
    tab_switch: 0,
    fullscreen_exit: 0,
    window_blur: 0,
  };

  violations.forEach((v) => {
    if (violationBreakdown[v.type] !== undefined) {
      violationBreakdown[v.type]++;
    }
  });

  const totalViolations = violations.length;

  // Agar 0 hai toh sirf "0" dikhega, warna breakdown
  let violationText = "0";
  if (totalViolations > 0) {
    violationText = Object.entries(violationBreakdown)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => {
        const label = type
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${count} ${label}`;
      })
      .join(", ");
  }

  const docDefinition = {
    content: [
      // ==========================================
      // 1. HEADER
      // ==========================================
      {
        text: "CodeSync",
        fontSize: 26,
        bold: true,
        alignment: "center",
        color: "#0A0A0B",
        margin: [0, 0, 0, 4],
      },
      {
        text: "Interview Assessment Report",
        fontSize: 14,
        alignment: "center",
        color: "#6A6A6F",
        margin: [0, 0, 0, 25],
      },

      // ==========================================
      // 2. INTERVIEW DETAILS
      // ==========================================
      {
        text: "INTERVIEW DETAILS",
        fontSize: 12,
        bold: true,
        color: "#0A0A0B",
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ["35%", "65%"],
          body: [
            [
              {
                text: "Interviewer",
                bold: true,
                color: "#0284C7",
                fillColor: "#F0F9FF",
                fontSize: 10,
              },
              { text: session.interviewer.name, fontSize: 10 },
            ],
            [
              {
                text: "Interviewer Email",
                bold: true,
                color: "#0284C7",
                fillColor: "#F0F9FF",
                fontSize: 10,
              },
              { text: session.interviewer.email, fontSize: 10 },
            ],
            [
              {
                text: "Candidate",
                bold: true,
                color: "#0284C7",
                fillColor: "#F0F9FF",
                fontSize: 10,
              },
              { text: session.candidateEmail, fontSize: 10 },
            ],
            [
              {
                text: "Scheduled At",
                bold: true,
                color: "#0284C7",
                fillColor: "#F0F9FF",
                fontSize: 10,
              },
              {
                text: new Date(session.scheduledAt).toLocaleString(),
                fontSize: 10,
              },
            ],
            [
              {
                text: "Violations",
                bold: true,
                color: "#0284C7",
                fillColor: "#F0F9FF",
                fontSize: 10,
              },
              {
                text: violationText,
                fontSize: 10,
                bold: totalViolations > 0,
                color: totalViolations > 0 ? "#DC2626" : "#0A0A0B",
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#E5E7EB",
          vLineColor: () => "#E5E7EB",
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 25],
      },

      // ==========================================
      // 3. INTERVIEWER NOTES
      // ==========================================
      {
        text: "INTERVIEWER NOTES",
        fontSize: 12,
        bold: true,
        color: "#0A0A0B",
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: notes || "No notes provided.",
                fontSize: 10,
                lineHeight: 1.3,
                color: "#333333",
                fillColor: "#F9FAFB",
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#E5E7EB",
          vLineColor: () => "#E5E7EB",
        },
        margin: [0, 0, 0, 25],
      },

      // ==========================================
      // 4. QUESTIONS & SUBMISSIONS
      // ==========================================
      {
        text: "QUESTIONS & SUBMISSIONS",
        fontSize: 12,
        bold: true,
        color: "#0A0A0B",
        margin: [0, 0, 0, 8],
      },
      ...questions
        .map((q, idx) => {
          const isPerfect =
            q.submission &&
            q.submission.passedCount === q.submission.totalCount;

          const parts = [
            // Question Title
            {
              text: `Q${idx + 1}: ${q.title}`,
              fontSize: 12,
              bold: true,
              color: "#0A0A0B",
              margin: [0, 10, 0, 3],
            },
            // Difficulty
            {
              text: `Difficulty: ${q.difficulty}`,
              fontSize: 10,
              color: "#6A6A6F",
              margin: [0, 0, 0, 5],
            },
          ];

          if (q.submission) {
            // Status
            parts.push({
              text: `Status: ${q.submission.passedCount} / ${q.submission.totalCount} Test Cases Passed`,
              color: isPerfect ? "#16A34A" : "#DC2626",
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 8],
            });

            // Code Box
            parts.push({
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      text: q.submission.code,
                      fontSize: 9,
                      font: "Courier",
                      lineHeight: 1.2,
                      color: "#1F2937",
                      fillColor: "#F8FAFC",
                      margin: [10, 10, 10, 10],
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => "#E2E8F0",
                vLineColor: () => "#E2E8F0",
              },
              margin: [0, 0, 0, 15],
            });
          } else {
            // No Submission
            parts.push({
              text: "Status: No Submission",
              color: "#DC2626",
              fontSize: 10,
              bold: true,
              margin: [0, 0, 0, 15],
            });
          }
          return parts;
        })
        .flat(),
    ],
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 40, 40, 40],
  };

  const dateStr = new Date().toISOString().split("T")[0];
  const safeEmail = session.candidateEmail.split("@")[0];
  const fileName = `Interview_Report_${safeEmail}_${dateStr}.pdf`;

  pdfMake.createPdf(docDefinition).download(fileName);
};
