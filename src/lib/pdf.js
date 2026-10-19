import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MONTHS } from './dates'

/*
 * Build an attendance-report PDF for a given month.
 *
 * @param {object} opts
 * @param {number} opts.year
 * @param {number} opts.month        0-indexed month
 * @param {Array}  opts.perPlayer     [{ name, present, total, pct }]
 * @param {number} opts.sessions
 * @param {number} opts.avgAttendance
 * @param {number} opts.totalMoney
 * @returns {jsPDF}
 */
export function buildAttendancePdf({ year, month, perPlayer, sessions, avgAttendance, totalMoney }) {
  const doc = new jsPDF()
  const purple = [123, 47, 247]

  // Header band
  doc.setFillColor(purple[0], purple[1], purple[2])
  doc.rect(0, 0, 210, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Rudra FC', 14, 12)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Attendance Report', 14, 20)

  // Report title
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${MONTHS[month]} ${year}`, 14, 38)

  // Summary line
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(
    `Sessions: ${sessions}    Players: ${perPlayer.length}    Avg Attendance: ${avgAttendance}%    Collected: Rs ${totalMoney}`,
    14,
    45
  )

  // Table of players
  autoTable(doc, {
    startY: 52,
    head: [['#', 'Player', 'Present', 'Total', 'Attendance %']],
    body: perPlayer.map((p, i) => [
      i + 1,
      p.name,
      String(p.present),
      String(p.total),
      `${p.pct}%`,
    ]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: purple, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 243, 251] },
    columnStyles: { 0: { cellWidth: 12 }, 4: { halign: 'center' } },
  })

  // Footer
  const generated = new Date().toLocaleString()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated ${generated}`, 14, doc.internal.pageSize.getHeight() - 8)

  return doc
}

/**
 * Share the PDF via the Web Share API when available (mobile), otherwise
 * trigger a download. Returns a short status string.
 */
export async function shareOrDownloadPdf(doc, filename) {
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })

  // Prefer native share with file support (mobile browsers)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Rudra FC Attendance Report',
        text: 'Attendance report from Rudra FC',
      })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
      // fall through to download
    }
  }

  // Fallback: download the file
  doc.save(filename)
  return 'downloaded'
}
